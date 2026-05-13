import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, isTokenExpired, type UserType } from "@/lib/auth";

export const useProtectedRoute = (requiredRole?: UserType) => {
  const { token, userType, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    // Token missing or expired → force logout + redirect
    if (!token || isTokenExpired(token) || userType === "guest") {
      logout();
      navigate({ to: "/login", replace: true });
      return;
    }

    if (requiredRole && userType !== requiredRole) {
      navigate({ to: "/", replace: true });
    }
  }, [token, userType, isLoading, requiredRole, navigate, logout]);

  return { isLoading };
};
