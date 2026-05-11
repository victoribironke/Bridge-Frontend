/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";

// AUTH
export const useLoginMutation = () => {
  const { setAuth } = useAuth();
  return useMutation({
    mutationFn: (data: any) => apiFetch<any>("/auth/login", { method: "POST", body: data }),
    onSuccess: (data) => {
      setAuth({
        token: data.accessToken,
        userType: data.userType,
        virtualAccountNumber: data.squadVirtualAccountNumber,
      });
    },
  });
};

export const useRegisterBusinessMutation = () => {
  const { setAuth } = useAuth();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>("/auth/register/business", { method: "POST", body: data }),
    onSuccess: (data) => {
      setAuth({
        token: data.accessToken,
        userType: data.userType,
        virtualAccountNumber: data.squadVirtualAccountNumber,
      });
    },
  });
};

export const useRegisterInvestorMutation = () => {
  const { setAuth } = useAuth();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>("/auth/register/investor", { method: "POST", body: data }),
    onSuccess: (data) => {
      setAuth({
        token: data.accessToken,
        userType: data.userType,
        virtualAccountNumber: data.squadVirtualAccountNumber,
      });
    },
  });
};

// BUSINESS ACTIONS
export const useConnectBankMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<any>("/business/connect-bank", { method: "POST", body: { code } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
    },
  });
};

export const useVerifyCacMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cacRegistrationNumber: string) =>
      apiFetch<any>("/verify/cac", { method: "POST", body: { cacRegistrationNumber } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profile"] });
    },
  });
};

export const useCalculateTermsMutation = () => {
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch<any>("/listings/calculate-terms", { method: "POST", body: data }),
  });
};

export const useCreateListingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiFetch<any>("/listings", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-active-listing"] });
      queryClient.invalidateQueries({ queryKey: ["business-stats"] });
    },
  });
};

// INVESTOR ACTIONS
export const useInvestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { listingId: string; amountCommitted: number }) =>
      apiFetch<any>("/investments", { method: "POST", body: data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["investor-summary"] });
      queryClient.invalidateQueries({ queryKey: ["investor-wallet"] });
      queryClient.invalidateQueries({ queryKey: ["investor-deals"] });
      queryClient.invalidateQueries({ queryKey: ["listing", variables.listingId] });
    },
  });
};

export const useUpdatePreferencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      apiFetch<any>(`/investor/${userId}/preferences`, { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investor-matched-listings"] });
    },
  });
};

// NOTIFICATIONS
export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<any>(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<any>(`/notifications/read-all`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
