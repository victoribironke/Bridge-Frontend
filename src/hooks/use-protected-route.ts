import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type UserType } from "@/lib/auth";

export const useProtectedRoute = (requiredRole?: UserType) => {
  const { userType, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (userType === "guest") {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (requiredRole && userType !== requiredRole) {
      navigate({ to: "/", replace: true });
    }
  }, [userType, isLoading, requiredRole, navigate]);

  return { isLoading };
};
