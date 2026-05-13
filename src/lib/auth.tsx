/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type UserType = "guest" | "investor" | "business";

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    // 30-second buffer to account for clock skew
    return payload.exp < Date.now() / 1000 - 30;
  } catch {
    return true;
  }
};

export type AuthState = {
  token: string | null;
  userType: UserType;
  virtualAccountNumber: string | null;
};

type AuthCtx = {
  token: string | null;
  userType: UserType;
  virtualAccountNumber: string | null;
  setAuth: (state: Partial<AuthState>) => void;
  logout: () => void;
  isLoading: boolean;
};

const defaultState: AuthCtx = {
  token: null,
  userType: "guest",
  virtualAccountNumber: null,
  setAuth: () => {},
  logout: () => {},
  isLoading: true,
};

const Ctx = createContext<AuthCtx>(defaultState);

const KEY = "bridge.auth";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    userType: "guest",
    virtualAccountNumber: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const storedToken = parsed.token || null;

          // Auto-clear expired tokens on boot
          if (storedToken && isTokenExpired(storedToken)) {
            window.localStorage.removeItem(KEY);
          } else {
            setAuthState({
              token: storedToken,
              userType: parsed.userType || "guest",
              virtualAccountNumber: parsed.virtualAccountNumber || null,
            });
          }
        } catch {
          window.localStorage.removeItem(KEY);
        }
      }
      setIsLoading(false);
    }
  }, []);

  const setAuth = (state: Partial<AuthState>) => {
    setAuthState((prev) => {
      const newState = { ...prev, ...state };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(KEY, JSON.stringify(newState));
      }
      return newState;
    });
  };

  const logout = () => {
    setAuthState({
      token: null,
      userType: "guest",
      virtualAccountNumber: null,
    });
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(KEY);
    }
  };

  return (
    <Ctx.Provider
      value={{
        ...authState,
        setAuth,
        logout,
        isLoading,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
