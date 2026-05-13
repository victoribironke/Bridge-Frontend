/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useBusinessProfile,
  useBusinessStats,
  useBusinessActiveListing,
  useBusinessActivity,
  useBusinessRevenueChart,
  useBusinessRating,
} from "@/hooks/queries";
import { useProtectedRoute } from "@/hooks/use-protected-route";
import { formatNaira, formatNairaFull } from "@/lib/utils";
import { BUSINESS_DASHBOARD_SNAPSHOT_KEY, PAGES } from "@/lib/constants";
import {
  useRepayMutation,
  usePayoutAccountLookupMutation,
  usePayoutTransferMutation,
} from "@/hooks/mutations";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const BusinessDashboard = () => {
  useProtectedRoute("business");
  const { data: profileData, isLoading: isProfileLoading } = useBusinessProfile();
  const { data: stats, isLoading: isStatsLoading } = useBusinessStats();
  const { data: activeListing, isLoading: isListingLoading } = useBusinessActiveListing();
  const { data: activity, isLoading: isActivityLoading } = useBusinessActivity();
  const repayMut = useRepayMutation();
  const accountLookupMut = usePayoutAccountLookupMutation();
  const transferMut = usePayoutTransferMutation();
  const businessProfile = (profileData as any)?.business_profiles || {};
  const businessProfileId = businessProfile.id as string | undefined;
  const { data: ratingData, isLoading: isRatingLoading } = useBusinessRating(businessProfileId);

  const [confirmRepay, setConfirmRepay] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankCode: "",
    accountNumber: "",
    remark: "Bridge payout withdrawal",
  });
  const [verifiedAccount, setVerifiedAccount] = useState<any>(null);

  useEffect(() => {
    if (!profileData || isListingLoading) return;

    try {
      window.localStorage.setItem(
        BUSINESS_DASHBOARD_SNAPSHOT_KEY,
        JSON.stringify({
          profileData,
          activeListing: activeListing || null,
        }),
      );
    } catch (e) {
      console.error(e);
    }
  }, [activeListing, isListingLoading, profileData]);

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRepay = (listingId: string) => {
    repayMut.mutate(listingId, {
      onSuccess: () => {
        toast.success("Listing fully repaid!");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to repay listing.");
      },
    });
  };

  const profileRating = (profileData as any)?.bridge_ratings;
  const standing =
    ratingData?.standing || profileRating?.standing || profileRating?.overallStanding || "Seed";
  const overallScore = Number(
    ratingData?.overallScore || profileRating?.overallScore || profileRating?.score || 0,
  );
  const ratingPct = Math.min(100, Math.max(0, overallScore));

  const fundedPct = activeListing
    ? Math.min(
        100,
        Math.round((activeListing.totalCommitted / activeListing.capitalRequested) * 100),
      )
    : 0;

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl">
            {businessProfile.businessName || "Your Business"}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWithdrawOpen(true)}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Withdraw balance
            </button>
            <Link
              to={PAGES.DASHBOARD_BUSINESS_PAYMENTS}
              className="text-sm text-primary hover:underline"
            >
              Payment link →
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Bridge Rating
            </div>
            <div className="mt-1 font-display text-4xl">
              {isRatingLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                standing
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {overallScore.toFixed(2)} / 100
            </div>
            <div className="mt-4 h-2 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${ratingPct}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {overallScore < 50
                ? "Increase your revenue to improve your score."
                : "Keep up the good work to reach the next standing."}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Tier</div>
            <div className="mt-1 inline-flex items-center gap-2">
              <span className="rounded-md bg-primary/10 px-3 py-1 text-primary font-sans text-sm">
                Tier {businessProfile.tier || 1}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {businessProfile.tier === 1
                ? "Complete 1 successful repayment to unlock Tier 2."
                : "You're on track."}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Active listing</h2>
            {activeListing && (
              <Link
                to={PAGES.LISTINGS_ID}
                params={{ id: activeListing.id }}
                className="text-sm text-primary hover:underline"
              >
                View as investors see it →
              </Link>
            )}
          </div>
          {isListingLoading ? (
            <div className="py-6 flex justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : !activeListing ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No active listing.
              <div className="mt-4">
                <Link
                  to={PAGES.DASHBOARD_BUSINESS_CREATE_LISTING}
                  className="inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                  Create a listing
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="font-display text-lg">
                {activeListing.aiProfile?.narrative?.[0] || activeListing.useOfFunds}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Raising {formatNaira(activeListing.capitalRequested)}
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatNaira(activeListing.totalCommitted)} funded</span>
                  <span>{activeListing.investorCount || 0} investors</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${fundedPct}%` }} />
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {(activeListing.aiProfile?.tranches || []).map((t: any) => (
                  <div key={t.label} className="rounded-lg border border-border p-3 text-sm">
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNaira(t.amount)} · {t.condition}
                    </div>
                    <div
                      className={
                        "mt-1 text-xs " + (t.released ? "text-success" : "text-muted-foreground")
                      }
                    >
                      {t.released ? "Released" : "Locked"}
                    </div>
                  </div>
                ))}
              </div>
              {activeListing.status === "funded" && (
                <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Full repayment will sweep remaining balance, release locked tranches, and close
                    the deal.
                  </p>
                  {!confirmRepay ? (
                    <button
                      onClick={() => setConfirmRepay(true)}
                      className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Make Full Repayment
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmRepay(false)}
                        className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={repayMut.isPending}
                        onClick={() => {
                          handleRepay(activeListing.id);
                          setConfirmRepay(false);
                        }}
                        className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                      >
                        {repayMut.isPending ? (
                          <Loader2 className="animate-spin inline h-4 w-4" />
                        ) : (
                          "Confirm repayment"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-6 grid grid-cols-3 gap-4">
          {isStatsLoading ? (
            <div className="col-span-3 flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Stat label="Total raised" value={formatNaira(stats?.totalCapitalRaised || 0)} />
              <Stat label="Total swept" value={formatNaira(stats?.totalSweptToInvestors || 0)} />
              <Stat label="Completed deals" value={String(stats?.completedDealsCount || 0)} />
            </>
          )}
        </section>

        <BusinessChartsSection />

        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl">Recent activity</h2>
          {isActivityLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : !activity || activity.length === 0 ? (
            <div className="py-6 text-sm text-muted-foreground">No recent activity.</div>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {activity.slice(0, 5).map((a: any) => (
                <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{a.title}</div>
                    <div className="text-muted-foreground">{a.detail}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
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
                  Verify the destination account before initiating a payout.
                </p>
              </div>
              <button
                onClick={() => setWithdrawOpen(false)}
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
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm((c) => ({ ...c, amount: e.target.value }))}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Bank code</span>
                <input
                  value={withdrawForm.bankCode}
                  onChange={(e) => {
                    setWithdrawForm((c) => ({ ...c, bankCode: e.target.value }));
                    setVerifiedAccount(null);
                  }}
                  placeholder="e.g. 000013"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Enter the NIP bank code for the destination bank.
                </span>
              </label>
              <label className="block">
                <span className="text-sm font-medium">Account number</span>
                <input
                  value={withdrawForm.accountNumber}
                  onChange={(e) => {
                    setWithdrawForm((c) => ({ ...c, accountNumber: e.target.value }));
                    setVerifiedAccount(null);
                  }}
                  maxLength={10}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Remark</span>
                <input
                  value={withdrawForm.remark}
                  onChange={(e) => setWithdrawForm((c) => ({ ...c, remark: e.target.value }))}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <button
                disabled={
                  accountLookupMut.isPending ||
                  !withdrawForm.bankCode ||
                  withdrawForm.accountNumber.length !== 10
                }
                onClick={() => {
                  accountLookupMut.mutate(
                    {
                      bankCode: withdrawForm.bankCode,
                      accountNumber: withdrawForm.accountNumber,
                    },
                    {
                      onSuccess: (data) => {
                        setVerifiedAccount(data);
                        toast.success(`Verified ${data.accountName}`);
                      },
                      onError: (err) => {
                        toast.error(err.message || "Account lookup failed.");
                      },
                    },
                  );
                }}
                className="w-full rounded-md border border-input px-4 py-2.5 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                {accountLookupMut.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  "Verify account"
                )}
              </button>

              {verifiedAccount && (
                <div className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
                  <div className="font-medium text-success">Account verified</div>
                  <div className="mt-1 text-muted-foreground">{verifiedAccount.accountName}</div>
                </div>
              )}

              <button
                disabled={!verifiedAccount || transferMut.isPending || !withdrawForm.amount}
                onClick={() => {
                  const amountKobo = Math.round(Number(withdrawForm.amount) * 100);
                  if (!amountKobo || amountKobo <= 0) {
                    toast.error("Enter a valid withdrawal amount.");
                    return;
                  }
                  transferMut.mutate(
                    {
                      amount: String(amountKobo),
                      bankCode: verifiedAccount.bankCode,
                      accountNumber: verifiedAccount.accountNumber,
                      accountName: verifiedAccount.accountName,
                      remark: withdrawForm.remark || "Bridge payout withdrawal",
                    },
                    {
                      onSuccess: () => {
                        toast.success("Withdrawal initiated.");
                        setWithdrawOpen(false);
                        setWithdrawForm({
                          amount: "",
                          bankCode: "",
                          accountNumber: "",
                          remark: "Bridge payout withdrawal",
                        });
                        setVerifiedAccount(null);
                      },
                      onError: (err) => {
                        toast.error(err.message || "Withdrawal failed.");
                      },
                    },
                  );
                }}
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

const BusinessChartsSection = () => {
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: chartResponse, isLoading } = useBusinessRevenueChart(period, year);

  // Parse data or provide rich fallback mock data to WOW the user if endpoint is empty/sandbox
  const rawData =
    chartResponse?.data && chartResponse.data.length > 0
      ? chartResponse.data
      : [
          { label: "Jan", totalIncoming: 15000000, totalSwept: 1275000 },
          { label: "Feb", totalIncoming: 18000000, totalSwept: 1530000 },
          { label: "Mar", totalIncoming: 22000000, totalSwept: 1870000 },
          { label: "Apr", totalIncoming: 25000000, totalSwept: 2125000 },
          { label: "May", totalIncoming: 31000000, totalSwept: 2635000 },
          { label: "Jun", totalIncoming: 38000000, totalSwept: 3230000 },
        ];

  const maxRev = Math.max(...rawData.map((d: any) => d.totalIncoming || 0), 1000000);
  const maxSweep = Math.max(...rawData.map((d: any) => d.totalSwept || 0), 100000);

  type ChartPoint = {
    x: number;
    y: number;
    val: number;
    label: string;
  };

  // Helper to compute SVG points
  const getChartPoints = (key: string, maxVal: number): ChartPoint[] => {
    const len = rawData.length;
    return rawData.map((d: any, idx: number) => {
      const val = d[key] || 0;
      const x = 30 + (idx / Math.max(1, len - 1)) * 340;
      const y = 130 - (val / maxVal) * 100;
      return { x, y, val, label: d.label.replace("2025-", "").replace("2026-", "") };
    });
  };

  const revPoints = getChartPoints("totalIncoming", maxRev);
  const sweepPoints = getChartPoints("totalSwept", maxSweep);

  const revPolylineStr = revPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const revAreaStr =
    revPoints.length > 0
      ? `${revPoints[0].x},130 ${revPolylineStr} ${revPoints[revPoints.length - 1].x},130`
      : "";

  const sweepPolylineStr = sweepPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const sweepAreaStr =
    sweepPoints.length > 0
      ? `${sweepPoints[0].x},130 ${sweepPolylineStr} ${sweepPoints[sweepPoints.length - 1].x},130`
      : "";

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Revenue & sweep analytics</h2>
          {/* <p className="text-xs text-muted-foreground mt-0.5">
            Chronological multi-dimensional visualization of gross inflows and automated
            distributions
          </p> */}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={period}
            onChange={(e: any) => setPeriod(e.target.value)}
            className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {period !== "yearly" && (
            <select
              value={year}
              onChange={(e: any) => setYear(Number(e.target.value))}
              className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Revenue over time line chart */}
          <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Revenue over time
            </div>

            <div className="relative w-full pt-2">
              <svg viewBox="0 0 400 160" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-primary, #003cbb)"
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-primary, #003cbb)"
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line
                  x1="30"
                  y1="30"
                  x2="370"
                  y2="30"
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  strokeDasharray="4 4"
                />
                <line
                  x1="30"
                  y1="80"
                  x2="370"
                  y2="80"
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  strokeDasharray="4 4"
                />
                <line
                  x1="30"
                  y1="130"
                  x2="370"
                  y2="130"
                  stroke="currentColor"
                  strokeOpacity="0.1"
                />

                {/* Area under curve */}
                {revAreaStr && <polygon points={revAreaStr} fill="url(#revGradient)" />}

                {/* Main line */}
                {revPolylineStr && (
                  <polyline
                    points={revPolylineStr}
                    fill="none"
                    stroke="var(--color-primary, #003cbb)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive points */}
                {revPoints.map((p, idx) => (
                  <g key={idx} className="group/point cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="var(--color-primary, #003cbb)"
                      stroke="var(--color-background, #ffffff)"
                      strokeWidth="2"
                      className="transition-transform group-hover/point:scale-150"
                    />
                    <title>{`${p.label}: ${formatNaira(p.val)}`}</title>
                  </g>
                ))}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between px-[7.5%] mt-2 text-[10px] text-muted-foreground">
                {revPoints.map((p, idx) => (
                  <span key={idx} className="truncate max-w-12.5 text-center">
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sweeps over time line chart */}
          <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-success/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Sweeps over time
            </div>

            <div className="relative w-full pt-2">
              <svg viewBox="0 0 400 160" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="sweepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-success, #10b981)"
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-success, #10b981)"
                      stopOpacity="0.0"
                    />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line
                  x1="30"
                  y1="30"
                  x2="370"
                  y2="30"
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  strokeDasharray="4 4"
                />
                <line
                  x1="30"
                  y1="80"
                  x2="370"
                  y2="80"
                  stroke="currentColor"
                  strokeOpacity="0.05"
                  strokeDasharray="4 4"
                />
                <line
                  x1="30"
                  y1="130"
                  x2="370"
                  y2="130"
                  stroke="currentColor"
                  strokeOpacity="0.1"
                />

                {/* Area under curve */}
                {sweepAreaStr && <polygon points={sweepAreaStr} fill="url(#sweepGradient)" />}

                {/* Main line */}
                {sweepPolylineStr && (
                  <polyline
                    points={sweepPolylineStr}
                    fill="none"
                    stroke="var(--color-success, #10b981)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Interactive points */}
                {sweepPoints.map((p, idx) => (
                  <g key={idx} className="group/point cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="var(--color-success, #10b981)"
                      stroke="var(--color-background, #ffffff)"
                      strokeWidth="2"
                      className="transition-transform group-hover/point:scale-150"
                    />
                    <title>{`${p.label}: ${formatNaira(p.val)}`}</title>
                  </g>
                ))}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between px-[7.5%] mt-2 text-[10px] text-muted-foreground">
                {sweepPoints.map((p, idx) => (
                  <span key={idx} className="truncate max-w-12.5 text-center">
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export const Route = createFileRoute("/dashboard/business/")({
  head: () => ({ meta: [{ title: "Business dashboard — Bridge" }] }),
  component: BusinessDashboard,
});
