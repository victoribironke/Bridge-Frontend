/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Squad checkout widget secret / public key (exposed to browser — use sandbox in dev). */
  readonly VITE_SQUAD_CHECKOUT_TOKEN?: string;
}
