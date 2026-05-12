/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Field,
  FormShell,
  GhostBtn,
  Input,
  PrimaryBtn,
  Select,
  Stepper,
  Textarea,
} from "@/components/form-bits";
import { SECTORS, PAGES } from "@/lib/constants";
import { formatNairaFull } from "@/lib/utils";

import { useRegisterBusinessMutation, useConnectBankMutation } from "@/hooks/mutations";
import { useBusinessProfile } from "@/hooks/queries";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const MONO_CONNECT_SCRIPT_ID = "mono-connect-script";
const MONO_CONNECT_SCRIPT_SRC = "https://connect.withmono.com/connect.js";
const MONO_PUBLIC_KEY = import.meta.env.VITE_MONO_PUBLIC_KEY || "test_pk_mvr35xxyg23ekjxo2u69";

type MonoConnectSuccessPayload = {
  code?: string;
};

type MonoConnectOptions = {
  key: string;
  scope: "auth";
  data?: {
    customer?: {
      name?: string;
      email?: string;
    };
  };
  onLoad?: () => void;
  onSuccess?: (payload: MonoConnectSuccessPayload) => void;
  onClose?: () => void;
};

type MonoConnectInstance = {
  setup: () => void;
  open: () => void;
};

type MonoConnectConstructor = new (options: MonoConnectOptions) => MonoConnectInstance;

declare global {
  interface Window {
    Connect?: MonoConnectConstructor;
  }
}

let monoConnectScriptPromise: Promise<void> | null = null;

const loadMonoConnectScript = () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Mono Connect can only be loaded in the browser."));
  }

  if (window.Connect) {
    return Promise.resolve();
  }

  if (monoConnectScriptPromise) {
    return monoConnectScriptPromise;
  }

  monoConnectScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      MONO_CONNECT_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    const handleLoad = (script: HTMLScriptElement) => {
      script.dataset.loaded = "true";
      if (window.Connect) {
        resolve();
      } else {
        monoConnectScriptPromise = null;
        reject(new Error("Mono Connect loaded but was not available."));
      }
    };

    const handleError = () => {
      monoConnectScriptPromise = null;
      reject(new Error("Failed to load Mono Connect."));
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
    script.id = MONO_CONNECT_SCRIPT_ID;
    script.src = MONO_CONNECT_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => handleLoad(script), { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return monoConnectScriptPromise;
};

const STEPS = ["Personal", "BVN", "Business", "Bank"];

const BusinessRegister = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const registerMut = useRegisterBusinessMutation();
  const connectMut = useConnectBankMutation();

  // form state
  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [bvn, setBvn] = useState("");
  const [biz, setBiz] = useState({
    name: "",
    sector: "",
    location: "",
    years: "",
    revenue: "",
    description: "",
    beneficiaryAccount: "",
  });

  const [bankData, setBankData] = useState<any>(null);
  const [monoStatus, setMonoStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [isMonoOpening, setIsMonoOpening] = useState(false);
  const monoConnectRef = useRef<MonoConnectInstance | null>(null);
  const isMountedRef = useRef(false);
  const hasNavigatedAfterBankVerificationRef = useRef(false);

  const { data: profileData, refetch: refetchBusinessProfile } = useBusinessProfile();
  const connectBankMutationRef = useRef(connectMut.mutate);
  const refetchBusinessProfileRef = useRef(refetchBusinessProfile);

  const monoInflow = (profileData as any)?.business_profiles?.monoAverageMonthlyInflow;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    connectBankMutationRef.current = connectMut.mutate;
  }, [connectMut.mutate]);

  useEffect(() => {
    refetchBusinessProfileRef.current = refetchBusinessProfile;
  }, [refetchBusinessProfile]);

  useEffect(() => {
    if (
      bankData &&
      !bankData.analyzed &&
      monoInflow != null &&
      !hasNavigatedAfterBankVerificationRef.current
    ) {
      hasNavigatedAfterBankVerificationRef.current = true;
      setBankData({ ...bankData, analyzed: true, inflow: monoInflow / 100 });
      toast.success("Registration complete. Welcome to your dashboard.");
      navigate({ to: PAGES.DASHBOARD_BUSINESS });
    }
  }, [monoInflow, bankData, navigate]);

  useEffect(() => {
    if (!bankData || bankData.analyzed) return;

    const pollId = window.setInterval(() => {
      refetchBusinessProfile();
    }, 5000);

    return () => window.clearInterval(pollId);
  }, [bankData, refetchBusinessProfile]);

  useEffect(() => {
    if (step !== 3 || bankData || monoConnectRef.current) return;

    if (!MONO_PUBLIC_KEY) {
      setMonoStatus("error");
      toast.error("Mono public key is not configured.");
      return;
    }

    setMonoStatus("loading");

    loadMonoConnectScript()
      .then(() => {
        if (!isMountedRef.current) return;

        const ConnectConstructor = window.Connect;
        if (!ConnectConstructor) {
          throw new Error("Mono Connect is unavailable after loading.");
        }

        const connect = new ConnectConstructor({
          key: MONO_PUBLIC_KEY,
          scope: "auth",
          data: {
            customer: {
              name: personal.name || "Bridge Business User",
              email: personal.email || "test@bridge.com",
            },
          },
          onLoad: () => {
            if (isMountedRef.current) {
              setMonoStatus("ready");
            }
          },
          onSuccess: ({ code }) => {
            setIsMonoOpening(false);

            if (!code) {
              toast.error("Mono did not return a connection code. Please try again.");
              return;
            }

            connectBankMutationRef.current(code, {
              onSuccess: () => {
                setBankData({ provider: "Mono", analyzed: false });
                refetchBusinessProfileRef.current();
                toast.success("Bank connected. We're analyzing your inflows.");
              },
              onError: (err) => {
                toast.error(err.message || "Failed to connect bank account.");
              },
            });
          },
          onClose: () => {
            setIsMonoOpening(false);
          },
        });

        monoConnectRef.current = connect;
        connect.setup();
      })
      .catch((err) => {
        if (isMountedRef.current) {
          setMonoStatus("error");
          toast.error(err.message || "Failed to load Mono Connect.");
        }
      });
  }, [bankData, personal.email, personal.name, step]);

  const phoneOk = /^(?:\+234|0)[789]\d{9}$/.test(personal.phone);
  const passwordOk = personal.password.length >= 8;

  const handleRegister = () => {
    registerMut.mutate(
      {
        fullName: personal.name,
        email: personal.email,
        phone: personal.phone,
        password: personal.password,
        bvn,
        businessName: biz.name,
        sector: biz.sector,
        location: biz.location,
        yearsInOperation: Number(biz.years),
        averageMonthlyRevenue: Number(biz.revenue) * 100, // kobo
        beneficiaryAccount: biz.beneficiaryAccount,
        businessDescription: biz.description,
      },
      {
        onSuccess: () => {
          setStep(3);
        },
        onError: (err) => {
          toast.error(err.message || "Registration failed.");
        },
      },
    );
  };

  const handleConnectBank = () => {
    if (monoStatus !== "ready" || !monoConnectRef.current) {
      toast.error("Mono Connect is still loading. Please try again in a moment.");
      return;
    }

    try {
      setIsMonoOpening(true);
      monoConnectRef.current.open();
    } catch (err: any) {
      setIsMonoOpening(false);
      toast.error(err.message || "Failed to open Mono Connect.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Set up your business account</h1>
      </div>
      <Stepper steps={STEPS} current={step} />
      <div className="mt-8">
        {step === 0 && (
          <FormShell
            title="Personal information"
            subtitle="Fill in your personal details to get started with Bridge."
            footer={
              <PrimaryBtn
                disabled={!personal.name || !personal.email || !phoneOk || !passwordOk}
                onClick={() => setStep(1)}
              >
                Continue
              </PrimaryBtn>
            }
          >
            <Field label="Full name">
              <Input
                value={personal.name}
                onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={personal.email}
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              />
            </Field>
            <Field label="Phone number" hint="Nigerian mobile, e.g. 0803XXXXXXX">
              <Input
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
              />
            </Field>
            <Field label="Password" hint="Minimum 8 characters">
              <Input
                type="password"
                value={personal.password}
                onChange={(e) => setPersonal({ ...personal, password: e.target.value })}
              />
            </Field>
          </FormShell>
        )}

        {step === 1 && (
          <FormShell
            title="Verify your BVN"
            subtitle="Your BVN is used to confirm your identity. We never share it."
            footer={
              <>
                <GhostBtn onClick={() => setStep(0)}>Back</GhostBtn>
                <PrimaryBtn disabled={bvn.length !== 11} onClick={() => setStep(2)}>
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field label="BVN">
              <Input value={bvn} onChange={(e) => setBvn(e.target.value)} maxLength={11} />
            </Field>
          </FormShell>
        )}

        {step === 2 && (
          <FormShell
            title="Business information"
            footer={
              <>
                <GhostBtn onClick={() => setStep(1)} disabled={registerMut.isPending}>
                  Back
                </GhostBtn>
                <PrimaryBtn
                  disabled={
                    !biz.name ||
                    biz.name.split(" ").length < 2 ||
                    !biz.sector ||
                    !biz.location ||
                    !biz.revenue ||
                    biz.beneficiaryAccount.length !== 10 ||
                    biz.description.length < 80 ||
                    registerMut.isPending
                  }
                  onClick={handleRegister}
                >
                  {registerMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify & Create Account"
                  )}
                </PrimaryBtn>
              </>
            }
          >
            <Field label="Business name (must include at least two words)">
              <Input value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
            </Field>
            <Field label="Business type">
              <Select
                value={biz.sector}
                onChange={(e) => setBiz({ ...biz, sector: e.target.value })}
              >
                <option value="">Select a sector</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Business location">
              <Input
                value={biz.location}
                onChange={(e) => setBiz({ ...biz, location: e.target.value })}
              />
            </Field>
            <Field label="Years in operation">
              <Input
                type="number"
                min={0}
                value={biz.years}
                onChange={(e) => setBiz({ ...biz, years: e.target.value })}
              />
            </Field>
            <Field
              label="Payout Bank Account"
              hint="10-digit Nigerian bank account for receiving funds"
            >
              <Input
                value={biz.beneficiaryAccount}
                onChange={(e) => setBiz({ ...biz, beneficiaryAccount: e.target.value })}
                maxLength={10}
              />
            </Field>
            <Field
              label="Average monthly revenue (₦)"
              hint="This figure will be compared to the linked bank account in the next step. Significant discrepancies appear on your profile."
            >
              <Input
                type="number"
                min={0}
                value={biz.revenue}
                onChange={(e) => setBiz({ ...biz, revenue: e.target.value })}
              />
            </Field>
            <Field label="Short description" hint={`${biz.description.length}/80 minimum`}>
              <Textarea
                rows={4}
                value={biz.description}
                onChange={(e) => setBiz({ ...biz, description: e.target.value })}
              />
            </Field>
          </FormShell>
        )}

        {step === 3 && (
          <FormShell
            title="Connect your bank account"
            subtitle="We read your inflows so investors see a real picture of your business."
          >
            {!bankData ? (
              <div className="rounded-xl border border-dashed border-border p-6">
                <div className="text-sm font-medium">Secure bank verification</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect securely with Mono so we can verify your average monthly inflow.
                </p>
                <PrimaryBtn
                  disabled={monoStatus !== "ready" || connectMut.isPending || isMonoOpening}
                  onClick={handleConnectBank}
                  className="mt-4 w-full"
                >
                  {connectMut.isPending || isMonoOpening || monoStatus === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : monoStatus === "error" ? (
                    "Unable to load Mono"
                  ) : (
                    "Connect"
                  )}
                </PrimaryBtn>
                {monoStatus === "error" && (
                  <p className="mt-3 text-xs text-destructive">
                    Mono Connect could not be loaded. Refresh the page and try again.
                  </p>
                )}
              </div>
            ) : !bankData.analyzed ? (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-5 text-sm">
                <div className="flex items-center gap-2 font-medium text-warning">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing bank data...
                </div>
                <div className="mt-2 text-muted-foreground">
                  We are currently processing inflows. This usually takes under a minute.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-success/40 bg-success/10 p-5 text-sm">
                <div className="font-medium text-success">✓ Bank connected</div>
                <div className="mt-2 text-muted-foreground">
                  Analyzed average monthly inflow:{" "}
                  <span className="font-medium text-foreground">
                    {formatNairaFull(bankData.inflow * 100)}
                  </span>
                </div>
              </div>
            )}
          </FormShell>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/register/business")({
  head: () => ({ meta: [{ title: "Business Sign Up — Bridge" }] }),
  component: BusinessRegister,
});
