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

/** GET /listings/:id/funding — live funding totals for a listing (use while your commitment is inactive). */
export type ListingFundingSnapshot = {
  capitalRequested: number;
  totalCommitted: number;
  investorCount: number;
};

export const useListingFunding = (listingId: string | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ["listing-funding", listingId],
    queryFn: async () => {
      const raw = await apiFetch<any>(`/listings/${listingId}/funding`);
      return {
        capitalRequested: Number(raw.capitalRequested ?? raw.capital_requested ?? 0),
        totalCommitted: Number(raw.totalCommitted ?? raw.total_committed ?? 0),
        investorCount: Number(raw.investorCount ?? raw.investor_count ?? 0),
      } satisfies ListingFundingSnapshot;
    },
    enabled: !!listingId && enabled,
    staleTime: 15_000,
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

export const useInvestorDeals = (status?: "inactive" | "active" | "completed" | "defaulted") => {
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

export type BusinessBalanceResponse = {
  balance: number;
};

/** GET /business/:userId/balance — internal ledger balance in kobo */
export const useBusinessBalance = () => {
  const userId = useUserId();
  return useQuery({
    queryKey: ["business-balance", userId],
    queryFn: () => apiFetch<BusinessBalanceResponse>(`/business/${userId}/balance`),
    enabled: !!userId,
    staleTime: DASHBOARD_STALE_TIME,
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

export type BusinessRevenuePeriod = "hourly" | "daily" | "monthly" | "yearly";

export type BusinessRevenueRow = {
  label: string;
  totalIncoming: number;
  totalSwept: number;
  totalRetained: number;
};

export type BusinessRevenueResponse = {
  period: BusinessRevenuePeriod;
  year: number | null;
  month: number | null;
  day?: number | null;
  data: BusinessRevenueRow[];
};

/** GET /business/:userId/revenue — kobo. `daily`: year+month; `hourly`: year+month+day; `monthly`: year. */
export const useBusinessRevenueChart = (
  period: BusinessRevenuePeriod,
  year?: number,
  month?: number,
  day?: number,
) => {
  const userId = useUserId();
  const paramsReady =
    period === "yearly" ||
    (period === "monthly" && year != null) ||
    (period === "daily" && year != null && month != null) ||
    (period === "hourly" && year != null && month != null && day != null);

  const params: Record<string, string | number> = { period };
  if (period !== "yearly" && year != null) params.year = year;
  if ((period === "daily" || period === "hourly") && month != null) params.month = month;
  if (period === "hourly" && day != null) params.day = day;

  return useQuery({
    queryKey: ["business-revenue-chart", userId, period, year, month, day],
    queryFn: () => apiFetch<BusinessRevenueResponse>(`/business/${userId}/revenue`, { params }),
    enabled: !!userId && paramsReady,
    staleTime: DASHBOARD_STALE_TIME,
  });
};

export type InvestorReturnsPeriod = "hourly" | "daily" | "monthly" | "yearly";

export type InvestorReturnsRow = {
  label: string;
  totalReturnsReceived: number;
  cumulativeReturns: number;
};

export type InvestorReturnsResponse = {
  period: InvestorReturnsPeriod;
  year: number | null;
  month: number | null;
  day?: number | null;
  data: InvestorReturnsRow[];
};

/** GET /investor/:userId/returns — kobo. `daily`: year+month; `hourly`: year+month+day; `monthly`: year. */
export const useInvestorPerformanceChart = (
  period: InvestorReturnsPeriod,
  year?: number,
  month?: number,
  day?: number,
) => {
  const userId = useUserId();

  const paramsReady =
    period === "yearly" ||
    (period === "monthly" && year != null) ||
    (period === "daily" && year != null && month != null) ||
    (period === "hourly" && year != null && month != null && day != null);

  const params: Record<string, string | number> = { period };
  if (period !== "yearly" && year != null) params.year = year;
  if ((period === "daily" || period === "hourly") && month != null) params.month = month;
  if (period === "hourly" && day != null) params.day = day;

  return useQuery({
    queryKey: ["investor-performance-chart", userId, period, year, month, day],
    queryFn: () => apiFetch<InvestorReturnsResponse>(`/investor/${userId}/returns`, { params }),
    enabled: !!userId && paramsReady,
    staleTime: DASHBOARD_STALE_TIME,
  });
};
