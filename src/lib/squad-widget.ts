/**
 * Squad payment modal (https://checkout.squadco.com/widget/squad.min.js).
 * Opens on the same page — no full-page redirect.
 *
 * The widget expects your Squad **public** key as `key` (`test_pk_…`). Secret keys (`sandbox_sk_…`)
 * or passing `token` instead of `key` cause Squad to error (e.g. "PUBLIC_KEY is required").
 *
 * Set `VITE_SQUAD_PUBLIC_KEY` in `.env` (see `.env.example`). `VITE_SQUAD_CHECKOUT_TOKEN` is a fallback name only.
 */

const getSquadPaymentModalKey = (): string => {
  const raw = import.meta.env.VITE_SQUAD_PUBLIC_KEY || import.meta.env.VITE_SQUAD_CHECKOUT_TOKEN;
  const t = typeof raw === "string" ? raw.trim() : "";
  if (t) return t;
  throw new Error(
    "Missing Squad public key. Set VITE_SQUAD_PUBLIC_KEY in .env (test_pk_… from Squad sandbox) and restart the dev server.",
  );
};

const SQUAD_WIDGET_SCRIPT_ID = "squad-checkout-widget-script";
const SQUAD_WIDGET_SCRIPT_SRC = "https://checkout.squadco.com/widget/squad.min.js";

type SquadWidgetInstance = {
  setup: () => void;
  open: () => void;
};

type SquadWidgetConstructor = new (options: Record<string, unknown>) => SquadWidgetInstance;

declare global {
  interface Window {
    squad?: SquadWidgetConstructor;
    Squad?: SquadWidgetConstructor;
  }
}

let squadWidgetScriptPromise: Promise<void> | null = null;

export const loadSquadWidgetScript = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Squad widget can only load in the browser."));
  }

  const getCtor = (): SquadWidgetConstructor | undefined => window.squad ?? window.Squad;

  if (getCtor()) {
    return Promise.resolve();
  }

  if (squadWidgetScriptPromise) {
    return squadWidgetScriptPromise;
  }

  squadWidgetScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      SQUAD_WIDGET_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    const handleLoad = (script: HTMLScriptElement) => {
      script.dataset.loaded = "true";
      if (getCtor()) {
        resolve();
      } else {
        squadWidgetScriptPromise = null;
        reject(new Error("Squad script loaded but constructor was not found."));
      }
    };

    const handleError = () => {
      squadWidgetScriptPromise = null;
      reject(new Error("Failed to load Squad checkout script."));
    };

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        handleLoad(existingScript);
        return;
      }
      existingScript.addEventListener("load", () => handleLoad(existingScript), { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SQUAD_WIDGET_SCRIPT_ID;
    script.src = SQUAD_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => handleLoad(script), { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return squadWidgetScriptPromise;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");

/** Bridge checkout session: we only need `transaction_ref` (+ optional email) from the API. */
const readCheckoutSession = (data: unknown) => {
  const d = data !== null && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const transactionRef =
    str(d.transaction_ref) || str(d.transactionRef) || str(d.transaction_reference) || "";
  const emailFromApi =
    str(d.email) || str(d.customerEmail) || str(d.customer_email) || str(d.payerEmail) || null;
  return { transactionRef, emailFromApi };
};

/** `origin` + `pathname` (no query/hash), as used for Squad `callback_url`. */
export const buildSquadCheckoutCallbackUrl = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
};

export const getEmailFromBridgeAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("bridge.auth");
  if (!raw) return null;
  try {
    const { token } = JSON.parse(raw) as { token?: string };
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1])) as { email?: string };
    return typeof payload.email === "string" && payload.email.trim() ? payload.email.trim() : null;
  } catch {
    return null;
  }
};

export type OpenInvestorSquadCheckoutParams = {
  amountKobo: number;
  session: unknown;
  /** Used when the API does not return an email on the session object. */
  emailFallback: string | null;
  onClose?: () => void;
  onSuccess?: (data: unknown) => void;
};

/**
 * Opens the Squad checkout popup on this page (no redirect).
 * `session` must supply `transaction_ref` from Bridge; merchant key comes from env (`key` param).
 */
export const openInvestorSquadWalletCheckout = async (
  params: OpenInvestorSquadCheckoutParams,
): Promise<void> => {
  const { amountKobo, session, emailFallback, onClose, onSuccess } = params;
  const { transactionRef, emailFromApi } = readCheckoutSession(session);

  if (!transactionRef) {
    throw new Error("Checkout session did not include a transaction reference.");
  }

  const email = emailFromApi || emailFallback;
  if (!email) {
    throw new Error("Email is required for Squad checkout. Ensure it is on the JWT or session.");
  }

  await loadSquadWidgetScript();
  const SquadCtor = window.squad ?? window.Squad;
  if (typeof SquadCtor !== "function") {
    throw new Error("Squad checkout is not available in this browser.");
  }

  const callbackUrl = buildSquadCheckoutCallbackUrl();

  const instance = new SquadCtor({
    key: getSquadPaymentModalKey(),
    email,
    amount: amountKobo,
    currency_code: "NGN",
    transaction_ref: transactionRef,
    callback_url: callbackUrl,
    payment_channels: ["card", "bank", "ussd", "transfer"],
    onClose,
    onSuccess,
  });

  instance.setup();
  instance.open();
};
