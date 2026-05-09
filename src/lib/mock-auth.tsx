import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthRole = "guest" | "investor" | "business";

type AuthCtx = {
  role: AuthRole;
  setRole: (r: AuthRole) => void;
};

const Ctx = createContext<AuthCtx>({ role: "guest", setRole: () => {} });

const KEY = "bridge.mockAuth";

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<AuthRole>("guest");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(KEY) as AuthRole | null;
    if (stored === "investor" || stored === "business" || stored === "guest") {
      setRoleState(stored);
    }
  }, []);

  const setRole = (r: AuthRole) => {
    setRoleState(r);
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, r);
  };

  return <Ctx.Provider value={{ role, setRole }}>{children}</Ctx.Provider>;
}

export function useMockAuth() {
  return useContext(Ctx);
}
