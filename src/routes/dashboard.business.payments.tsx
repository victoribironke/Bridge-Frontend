/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  useBusinessPaymentLink,
  useBusinessSweepSummary,
  useBusinessPayments,
  useBusinessBalance,
  usePayouts,
} from "@/hooks/queries";
import { usePayoutTransferMutation, useSimulateRevenueMutation } from "@/hooks/mutations";
import { useProtectedRoute } from "@/hooks/use-protected-route";
import { useAuth } from "@/lib/auth";
import { formatNaira, formatNairaFull, formatActivityTimestamp } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const INFLOW_POLL_INTERVAL_MS = 1000;
const INFLOW_POLL_TICKS = 20;

const Payments = () => {
  useProtectedRoute("business");
  const queryClient = useQueryClient();
  const { virtualAccountNumber } = useAuth();
  const { data: linkData, isLoading: isLinkLoading } = useBusinessPaymentLink();
  const { data: sweepSummary, isLoading: isSweepLoading } = useBusinessSweepSummary();
  const { data: paymentsData, isLoading: isPaymentsLoading } = useBusinessPayments();
  const { data: balanceData, isLoading: isBalanceLoading } = useBusinessBalance();
  const { data: payoutsData, isLoading: isPayoutsLoading } = usePayouts();
  const transferMut = usePayoutTransferMutation();
  const simulateRevenueMut = useSimulateRevenueMutation();

  const link = linkData?.paymentLink;
  const qr = link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`
    : null;
  const displayVirtualAccountNumber = linkData?.virtualAccountNumber || virtualAccountNumber;

  const [copied, setCopied] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const pollTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearInflowPoll = () => {
    pollTimeoutsRef.current.forEach((id) => clearTimeout(id));
    pollTimeoutsRef.current = [];
  };

  const refetchPaymentsStats = () =>
    Promise.all([
      queryClient.refetchQueries({ queryKey: ["business-sweep-summary"] }),
      queryClient.refetchQueries({ queryKey: ["business-payments"] }),
      queryClient.refetchQueries({ queryKey: ["business-balance"] }),
    ]);

  const startInflowPoll = () => {
    clearInflowPoll();
    for (let i = 0; i < INFLOW_POLL_TICKS; i++) {
      const id = setTimeout(() => {
        void refetchPaymentsStats();
      }, i * INFLOW_POLL_INTERVAL_MS);
      pollTimeoutsRef.current.push(id);
    }
  };

  useEffect(() => {
    return () => clearInflowPoll();
  }, []);

  const payments = paymentsData || [];
  const payouts = payoutsData?.data || [];
  const totalSwept = sweepSummary?.totalSwept ?? sweepSummary?.totalSweptKobo ?? 0;
  const totalRemaining = sweepSummary?.totalRemaining ?? sweepSummary?.totalRemainingKobo ?? 0;
  const currentSweepPercent = sweepSummary?.currentSweepPercent || 0;

  const copy = async () => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const share = async () => {
    if (!link) return;

    if (navigator.share)
      await navigator.share({ title: "Pay me on Bridge", url: link }).catch(() => {});
    else copy();
  };

  const submitWithdrawal = () => {
    const amountKobo = Math.round(Number(withdrawAmount) * 100);
    if (!amountKobo || amountKobo <= 0) {
      toast.error("Enter a valid withdrawal amount.");
      return;
    }

    transferMut.mutate(
      { amount: String(amountKobo) },
      {
        onSuccess: () => {
          toast.success("Withdrawal initiated.");
          setWithdrawOpen(false);
          setWithdrawAmount("");
        },
        onError: (err) => {
          toast.error(err.message || "Withdrawal failed.");
        },
      },
    );
  };

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl">Payments</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                simulateRevenueMut.mutate(undefined, {
                  onSuccess: (data) => {
                    toast.success(
                      data.message ||
                        `Simulation started (${data.deposits} deposits every ${data.intervalSeconds}s).`,
                    );
                    startInflowPoll();
                  },
                  onError: (err) => {
                    toast.error(err.message || "Could not start inflow simulation.");
                  },
                })
              }
              disabled={simulateRevenueMut.isPending}
              className="text-xs text-muted-foreground/60 underline decoration-muted-foreground/25 underline-offset-2 hover:text-muted-foreground disabled:opacity-40"
            >
              {simulateRevenueMut.isPending ? "…" : "Inflow"}
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Withdraw
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            {isLinkLoading ? (
              <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-lg border border-border bg-secondary/50">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : qr ? (
              <img
                src={qr}
                alt="Payment QR code"
                className="mx-auto rounded-lg border border-border"
                width={240}
                height={240}
              />
            ) : (
              <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 px-4 text-sm text-muted-foreground">
                Payment link unavailable
              </div>
            )}
            {qr ? (
              <a
                href={qr}
                download="bridge-payment-qr.png"
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Download QR
              </a>
            ) : (
              <span className="mt-3 inline-block text-sm text-muted-foreground">Download QR</span>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Payment link
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-secondary px-3 py-2 text-sm">
                {isLinkLoading ? "Loading link..." : link || "Payment link unavailable"}
              </code>
              <button
                onClick={copy}
                disabled={isLinkLoading || !link}
                className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={share}
                disabled={isLinkLoading || !link}
                className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                Share
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              When customers pay through this link, the money lands in your Bridge Squad account (
              <span className="font-medium text-foreground">
                {displayVirtualAccountNumber || "Pending"}
              </span>
              ). The platform automatically sweeps the agreed share to investors. Nothing for you to
              do.
            </p>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {isSweepLoading || isBalanceLoading ? (
            <div className="col-span-full flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Stat label="Swept to date" value={formatNaira(totalSwept)} />
              <Stat label="Remaining to sweep" value={formatNaira(totalRemaining)} />
              <Stat label="Current sweep" value={`${currentSweepPercent}%`} />
              <Stat label="Ledger balance" value={formatNairaFull(balanceData?.balance ?? 0)} />
            </>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Recent payments</h2>
          {isPaymentsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Payment history will appear here after your first customer pays through the link.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th>Incoming</th>
                    <th>Service Fee</th>
                    <th>Sweep</th>
                    <th>Net</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p: any) => {
                    const hasIncoming = p.incomingPaymentAmount != null || p.incomingKobo != null;
                    const incoming = hasIncoming
                      ? Number(p.incomingPaymentAmount ?? p.incomingKobo ?? 0)
                      : null;
                    const sweep = p.sweepAmount ?? p.sweepKobo ?? 0;
                    const net = p.netAmountRetained ?? p.netKobo ?? 0;
                    const processedAt = p.processedAt || p.createdAt;
                    const sweepApplied = p.sweepApplied ?? Number(sweep) > 0;

                    return (
                      <tr key={p.id}>
                        <td className="py-3">{formatActivityTimestamp(processedAt)}</td>
                        <td>{incoming != null ? formatNairaFull(incoming) : "—"}</td>
                        <td>{p.serviceFee != null ? formatNairaFull(p.serviceFee) : 0}</td>
                        <td>{sweepApplied ? formatNairaFull(sweep) : "—"}</td>
                        <td className="font-medium">{formatNairaFull(net)}</td>
                        <td>
                          <span
                            className={
                              "text-xs " + (sweepApplied ? "text-success" : "text-muted-foreground")
                            }
                          >
                            {sweepApplied ? "✓ Sweep processed" : "No sweep applied"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Recent withdrawals</h2>
          {isPayoutsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : payouts.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Withdrawal history will appear here after your first payout.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2">Date</th>
                    <th>Amount</th>
                    <th>Reference</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((p: any) => (
                    <tr key={p.id || p.transactionReference}>
                      <td className="py-3">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td>{formatNairaFull(Number(p.amount || p.amountKobo || 0))}</td>
                      <td className="max-w-55 truncate">{p.transactionReference || "—"}</td>
                      <td>{p.status || "Pending"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">Withdraw funds</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Funds will be sent to the bank account you provided during registration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWithdrawOpen(false);
                  setWithdrawAmount("");
                }}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Amount (₦)</span>
                <input
                  type="number"
                  min={1}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <button
                type="button"
                disabled={transferMut.isPending || !withdrawAmount || Number(withdrawAmount) <= 0}
                onClick={submitWithdrawal}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {transferMut.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Confirm withdrawal"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="font-display text-2xl">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
};

export const Route = createFileRoute("/dashboard/business/payments")({
  head: () => ({ meta: [{ title: "Payments — Bridge" }] }),
  component: Payments,
});
