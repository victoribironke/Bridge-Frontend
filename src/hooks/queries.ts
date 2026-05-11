/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

// Helper to extract userId from token
export const useUserId = () => {
  const { token } = useAuth();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.id || null;
  } catch (e) {
    return null;
  }
};

// PLATFORM
export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => apiFetch<any>("/platform/stats"),
  });
};

export const useListings = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["listings", params],
    queryFn: () => apiFetch<any>("/listings", { params }),
  });
};

export const useListingDetail = (id: string) => {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => apiFetch<any>(`/listings/${id}`),
    enabled: !!id,
  });
};

export const usePreviewTerms = (capitalRequested?: number) => {
  return useQuery({
    queryKey: ["preview-terms", capitalRequested],
    queryFn: () =>
      apiFetch<any>("/listings/preview-terms", {
        params: { capitalRequested },
      }),
    enabled: !!capitalRequested && capitalRequested > 0,
  });
};

// INVESTOR
export const useInvestorSummary = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["investor-summary", userId],
    queryFn: () => apiFetch<any>(`/investor/${userId}/summary`),
    enabled: !!userId,
  });
};

export const useInvestorActivity = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["investor-activity", userId],
    queryFn: () => apiFetch<any>(`/investor/${userId}/activity`),
    enabled: !!userId,
  });
};

export const useInvestorMatchedListings = () => {
  const { userType } = useAuth();
  return useQuery({
    queryKey: ["investor-matched-listings"],
    queryFn: () => apiFetch<any>(`/listings/matched`),
    enabled: userType === "investor",
  });
};

export const useInvestorWallet = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["investor-wallet", userId],
    queryFn: () => apiFetch<any>(`/investor/${userId}/wallet`),
    enabled: !!userId,
  });
};

export const usePaymentLink = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["investor-payment-link", userId],
    queryFn: () => apiFetch<any>(`/investor/${userId}/payment-link`),
    enabled: !!userId,
  });
};

export const useInvestorDeals = (status?: "active" | "completed" | "defaulted") => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["investor-deals", userId, status],
    queryFn: () =>
      apiFetch<any>(`/investor/${userId}/deals`, { params: status ? { status } : undefined }),
    enabled: !!userId,
  });
};

// BUSINESS
export const useBusinessProfile = (options?: { refetchInterval?: number | false }) => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-profile", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/profile`),
    enabled: !!userId,
    refetchInterval: options?.refetchInterval as any,
  });
};

export const useBusinessStats = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-stats", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/stats`),
    enabled: !!userId,
  });
};

export const useBusinessActiveListing = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-active-listing", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/active-listing`),
    enabled: !!userId,
  });
};

export const useBusinessActivity = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-activity", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/activity`),
    enabled: !!userId,
  });
};

export const useBusinessPaymentLink = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-payment-link", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/payment-link`),
    enabled: !!userId,
  });
};

export const useBusinessPayments = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-payments", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/payments`),
    enabled: !!userId,
  });
};

export const useBusinessSweepSummary = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-sweep-summary", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/sweep-summary`),
    enabled: !!userId,
  });
};

// NOTIFICATIONS
export const useNotifications = () => {
  const { userType } = useAuth();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<any>("/notifications"),
    enabled: userType !== "guest",
  });
};
