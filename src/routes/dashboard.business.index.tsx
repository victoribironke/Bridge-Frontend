/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  useBusinessProfile,
  useBusinessStats,
  useBusinessActiveListing,
  useBusinessActivity,
  useBusinessRevenueChart,
  type BusinessRevenuePeriod,
  useBusinessRating,
  useBusinessBalance,
} from "@/hooks/queries";
import { useProtectedRoute } from "@/hooks/use-protected-route";
import {
  formatNaira,
  formatNairaFull,
  formatActivityTimestamp,
  formatChartAxisLabel,
  normalizeListingResponse,
  getTrancheDisplay,
  parseAiProfile,
} from "@/lib/utils";
import { BUSINESS_DASHBOARD_SNAPSHOT_KEY, PAGES } from "@/lib/constants";
import { useRepayMutation, usePayoutTransferMutation } from "@/hooks/mutations";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const BusinessDashboard = () => {
  useProtectedRoute("business");
  const { data: profileData, isLoading: isProfileLoading } = useBusinessProfile();
  const { data: stats, isLoading: isStatsLoading } = useBusinessStats();
  const { data: activeListing, isLoading: isListingLoading } = useBusinessActiveListing();
  const { data: activity, isLoading: isActivityLoading } = useBusinessActivity();
  const { data: balanceData, isLoading: isBalanceLoading } = useBusinessBalance();
  const repayMut = useRepayMutation();
  const transferMut = usePayoutTransferMutation();
  const businessProfile = (profileData as any)?.business_profiles || {};
  const businessProfileId = businessProfile.id as string | undefined;
  const { data: ratingData, isLoading: isRatingLoading } = useBusinessRating(businessProfileId);

  let tranches = [];

  if (activeListing) {
    const listing = normalizeListingResponse(activeListing);

    const aiProfile = parseAiProfile(listing?.aiProfile);
    tranches = getTrancheDisplay(listing, aiProfile);
  }

  const [confirmRepay, setConfirmRepay] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

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
    const loadingToastId = toast.loading("Processing full repayment…");
    repayMut.mutate(listingId, {
      onSuccess: (data) => {
        toast.dismiss(loadingToastId);
        const msg =
          data && typeof data === "object" && typeof (data as any).message === "string"
            ? (data as any).message
            : "Listing fully repaid!";
        toast.success(msg);
        setConfirmRepay(false);
      },
      onError: (err: unknown) => {
        toast.dismiss(loadingToastId);
        const message = err instanceof Error ? err.message : "Failed to repay listing.";
        toast.error(message);
        setConfirmRepay(false);
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
          {/* <div className="flex items-center gap-3">
            <button
              onClick={() => setWithdrawOpen(true)}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Withdraw balance
            </button>
          </div> */}
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Bridge rating
              </div>
              <span className="shrink-0 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground">
                Tier {businessProfile.tier ?? 1}
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="font-display text-3xl sm:text-4xl">
                {isRatingLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  standing
                )}
              </div>
              {/* <div className="text-sm text-muted-foreground tabular-nums">
                Score {overallScore.toFixed(0)}
                <span className="text-muted-foreground/70"> / 100</span>
              </div> */}
            </div>
            <div className="mt-4 h-2 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${ratingPct}%` }} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {overallScore < 50
                ? "Earn consistent revenue to improve your standing."
                : "Keep repayment steady to reach the next standing."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {businessProfile.tier === 1
                ? "Tier 1: complete a successful repayment to unlock Tier 2."
                : "Higher tiers unlock larger listing caps as you build history."}
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Ledger balance
              </div>
              <div className="mt-2 font-display text-3xl sm:text-4xl">
                {isBalanceLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  formatNairaFull(balanceData?.balance ?? 0)
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Available on your internal ledger. Withdraw to your registered bank account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              className="mt-6 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary sm:mt-4 sm:w-auto sm:self-start"
            >
              Withdraw balance
            </button>
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
            <div className="relative mt-4 min-h-[120px]">
              {repayMut.isPending && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background/85 px-4 py-8 text-center backdrop-blur-sm"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Processing full repayment…</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Sweeping balance and closing the deal. This may take a few seconds.
                  </p>
                </div>
              )}
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

              <div>
                <div className="text-sm font-medium">Tranche structure</div>
                <ol className="mt-3 space-y-3">
                  {tranches.map((t: any) => (
                    <li
                      key={t.label}
                      className="flex items-start justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <div className="font-medium">
                          {t.label} · {formatNaira(t.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">{t.condition}</div>
                      </div>
                      <span
                        className={
                          "text-xs " + (t.released ? "text-success" : "text-muted-foreground")
                        }
                      >
                        {t.released ? "Released" : "Locked"}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {activeListing.status === "funded" && (
                <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Full repayment will sweep remaining balance, release locked tranches, and close
                    the deal.
                  </p>
                  {!confirmRepay ? (
                    <button
                      type="button"
                      disabled={repayMut.isPending}
                      onClick={() => setConfirmRepay(true)}
                      className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Make Full Repayment
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={repayMut.isPending}
                        onClick={() => setConfirmRepay(false)}
                        className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={repayMut.isPending}
                        onClick={() => handleRepay(activeListing.id)}
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
                  <span className="shrink-0 text-right text-xs text-muted-foreground">
                    {formatActivityTimestamp(a.createdAt)}
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
                  Funds will be sent to the bank account you provided during registration.
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
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>

              <button
                disabled={transferMut.isPending || !withdrawAmount || Number(withdrawAmount) <= 0}
                onClick={() => {
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
  const now = new Date();
  const [period, setPeriod] = useState<BusinessRevenuePeriod>("hourly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState(now.getDate());

  const daysInSelectedMonth = new Date(year, month, 0).getDate();

  useEffect(() => {
    setDay((d) => Math.min(d, new Date(year, month, 0).getDate()));
  }, [year, month]);

  const {
    data: chartResponse,
    isLoading,
    isError,
    error,
  } = useBusinessRevenueChart(
    period,
    period === "yearly" ? undefined : year,
    period === "daily" || period === "hourly" ? month : undefined,
    period === "hourly" ? day : undefined,
  );

  const rawData = chartResponse?.data ?? [];
  const hasData = rawData.length > 0;
  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const maxRev = Math.max(...rawData.map((d) => d.totalIncoming), 1);
  const maxSweep = Math.max(...rawData.map((d) => d.totalSwept), 1);

  type ChartPoint = {
    x: number;
    y: number;
    val: number;
    label: string;
  };

  const getChartPoints = (key: "totalIncoming" | "totalSwept", maxVal: number): ChartPoint[] => {
    const len = rawData.length;
    return rawData.map((d, idx) => {
      const val = d[key] || 0;
      const x = 30 + (idx / Math.max(1, len - 1)) * 340;
      const y = 130 - (val / maxVal) * 100;
      return { x, y, val, label: formatChartAxisLabel(d.label, period) };
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

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl text-foreground">Revenue & sweep analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as BusinessRevenuePeriod)}
            className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {period !== "yearly" && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {(period === "daily" || period === "hourly") && (
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none"
            >
              {monthNames.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          )}
          {period === "hourly" && (
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              aria-label="Day of month"
              className="rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none"
            >
              {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 py-12 text-center text-sm text-destructive px-4">
          {error instanceof Error ? error.message : "Could not load revenue data."}
        </div>
      ) : !hasData ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No revenue data for this selection yet.
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <div className="relative mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Incoming revenue
            </div>

            <div className="relative w-full pt-2">
              <svg viewBox="0 0 400 160" className="h-auto w-full overflow-visible">
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

                {revAreaStr && <polygon points={revAreaStr} fill="url(#revGradient)" />}

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

              <div className="mt-2 flex justify-between px-[7.5%] text-[10px] text-muted-foreground">
                {revPoints.map((p, idx) => (
                  <span key={idx} className="max-w-12.5 truncate text-center">
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-32 w-32 rounded-full bg-success/5 blur-2xl pointer-events-none" />
            <div className="relative mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Swept to investors
            </div>

            <div className="relative w-full pt-2">
              <svg viewBox="0 0 400 160" className="h-auto w-full overflow-visible">
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

                {sweepAreaStr && <polygon points={sweepAreaStr} fill="url(#sweepGradient)" />}

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

              <div className="mt-2 flex justify-between px-[7.5%] text-[10px] text-muted-foreground">
                {sweepPoints.map((p, idx) => (
                  <span key={idx} className="max-w-12.5 truncate text-center">
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
