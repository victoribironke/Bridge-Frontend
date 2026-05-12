/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

const DASHBOARD_STALE_TIME = 60 * 1000;

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

export const usePreviewTerms = (
  capitalRequested?: number,
  preferredRepaymentMonths = 12,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["preview-terms", capitalRequested, preferredRepaymentMonths],
    queryFn: () =>
      apiFetch<any>("/listings/calculate-terms", {
        method: "POST",
        body: { capitalRequested, preferredRepaymentMonths },
      }),
    enabled: enabled && !!capitalRequested && capitalRequested > 0,
    retry: false,
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
export const useBusinessProfile = (enabled = true) => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-profile", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/profile`),
    enabled: enabled && !!userId,
    staleTime: DASHBOARD_STALE_TIME,
  });
};

export const useBusinessProfileById = (userId: string) => {
  return useQuery({
    queryKey: ["business-profile", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/profile`),
    enabled: !!userId,
    staleTime: DASHBOARD_STALE_TIME,
  });
};

export const useBusinessRating = (businessId?: string) => {
  return useQuery({
    queryKey: ["business-rating", businessId],
    queryFn: () => apiFetch<any>(`/business/${businessId}/rating`),
    enabled: !!businessId,
    staleTime: DASHBOARD_STALE_TIME,
  });
};

export const useBusinessStats = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-stats", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/stats`),
    enabled: !!userId,
    staleTime: DASHBOARD_STALE_TIME,
  });
};

export const useBusinessActiveListing = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-active-listing", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/active-listing`),
    enabled: !!userId,
    staleTime: DASHBOARD_STALE_TIME,
  });
};

export const useBusinessActivity = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-activity", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/activity`),
    enabled: !!userId,
    staleTime: DASHBOARD_STALE_TIME,
  });
};

export const useBusinessPaymentLink = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-payment-link", userId],
    queryFn: () => apiFetch<any>(`/business/${userId}/payment-link`),
    enabled: !!userId,
    staleTime: DASHBOARD_STALE_TIME,
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

export const usePayouts = (page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ["payouts", page, perPage],
    queryFn: () => apiFetch<any>("/payouts/list", { params: { page, perPage } }),
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

export const useBusinessRevenueChart = (period: string, year?: number, month?: number) => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-revenue-chart", userId, period, year, month],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("period", period);
      if (year) params.append("year", year.toString());
      if (month) params.append("month", month.toString());
      return apiFetch<any>(`/business/${userId}/revenue?${params.toString()}`);
    },
    enabled: !!userId,
  });
};

export const useInvestorPerformanceChart = (period: string, year?: number, month?: number) => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["investor-performance-chart", userId, period, year, month],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("period", period);
      if (year) params.append("year", year.toString());
      if (month) params.append("month", month.toString());
      return apiFetch<any>(`/investor/${userId}/performance?${params.toString()}`);
    },
    enabled: !!userId,
  });
};
