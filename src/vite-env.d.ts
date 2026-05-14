/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Squad payment modal public key (`test_pk_…` / `pk_…`) from Squad dashboard — required by the widget as `key`. */
  readonly VITE_SQUAD_PUBLIC_KEY?: string;
  /** @deprecated Use VITE_SQUAD_PUBLIC_KEY; same value passed as widget `key`. */
  readonly VITE_SQUAD_CHECKOUT_TOKEN?: string;
}
