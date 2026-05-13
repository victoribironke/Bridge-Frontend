/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useListingDetail } from "@/hooks/queries";
import { useInvestMutation } from "@/hooks/mutations";
import { formatNairaFull, formatNaira } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PAGES } from "@/lib/constants";
import { Loader2, Banknote, Target } from "lucide-react";
import { toast } from "sonner";

const normalizeListingResponse = (response: any) => {
  if (!response) return null;

  if (response.listings) {
    return {
      ...response.listings,
      business_profiles: response.business_profiles,
      bridge_ratings: response.bridge_ratings,
      tranches: response.tranches,
      businessSquadVirtualAccountNumber: response.businessSquadVirtualAccountNumber,
    };
  }

  return response;
};

const parseAiProfile = (aiProfile: any) => {
  if (!aiProfile) return null;

  if (typeof aiProfile === "object") return aiProfile;

  if (typeof aiProfile === "string") {
    try {
      return JSON.parse(aiProfile);
    } catch (e) {
      return { narrative: aiProfile };
    }
  }

  return null;
};

const toParagraphs = (value: any) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
};

const getRatingBreakdown = (rating: any) => {
  if (!rating) return [];

  if (Array.isArray(rating.components)) return rating.components;

  return [
    { label: "Repayment speed", contribution: Number(rating.repaymentSpeedScore || 0) },
    { label: "Repayment consistency", contribution: Number(rating.repaymentConsistencyScore || 0) },
    { label: "Transaction volume", contribution: Number(rating.transactionVolumeScore || 0) },
    { label: "Revenue consistency", contribution: Number(rating.revenueConsistencyScore || 0) },
    { label: "CAC bonus", contribution: Number(rating.cacBonusScore || 0) },
    { label: "Communication", contribution: Number(rating.communicationScore || 0) },
  ].filter((component) => component.contribution > 0);
};

const getTrancheDisplay = (listing: any, aiProfile: any) => {
  if (Array.isArray(listing.tranches) && listing.tranches.length > 0) {
    return listing.tranches.map((tranche: any) => ({
      label: `Tranche ${tranche.trancheNumber}`,
      amount: tranche.amount,
      condition: tranche.releaseCondition,
      released: tranche.status === "released" || !!tranche.releasedAt,
    }));
  }

  return aiProfile?.tranches || [];
};

const getTrustSignals = (listing: any, aiProfile: any) => {
  if (Array.isArray(aiProfile?.trustSignals) && aiProfile.trustSignals.length > 0) {
    return aiProfile.trustSignals;
  }

  const business = listing.business_profiles;
  return [
    {
      label: "Bank data",
      detail: business?.monoAverageMonthlyInflow ? "Verified inflows" : "Connection pending",
      status: business?.monoAverageMonthlyInflow ? "pass" : "warning",
    },
    {
      label: "CAC verification",
      detail: business?.cacVerified ? "Verified" : "Not verified",
      status: business?.cacVerified ? "pass" : "warning",
    },
    {
      label: "Business profile",
      detail: business?.yearsInOperation
        ? `${business.yearsInOperation} years in operation`
        : business?.sector,
      status: "pass",
    },
  ].filter((signal) => signal.detail);
};

const ListingDetailPage = () => {
  const { id } = Route.useParams();
  const { data: listingResponse, isLoading } = useListingDetail(id);
  const listing = useMemo(() => normalizeListingResponse(listingResponse), [listingResponse]);
  const { userType: role } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(50_000);
  const [showConfirm, setShowConfirm] = useState(false);
  const investMut = useInvestMutation();

  const projected = useMemo(() => {
    if (!listing) return { expected: 0, total: 0, months: 0 };
    const totalReturnPercent = Number(listing.totalReturnPercent || 0);
    const expected = Math.round(amount * (totalReturnPercent / 100));
    return { expected, total: amount + expected, months: listing.targetRepaymentMonths };
  }, [amount, listing]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) return <div className="p-10 text-center">Listing not found</div>;

  const fundedPct = Math.min(
    100,
    Math.round((listing.totalCommitted / listing.capitalRequested) * 100),
  );

  const handleInvest = () => {
    if (role !== "investor") {
      navigate({ to: PAGES.REGISTER_INVESTOR });
      return;
    }
    setShowConfirm(true);
  };

  const confirmInvest = () => {
    investMut.mutate(
      { listingId: id, amountCommitted: amount * 100 },
      {
        onSuccess: () => {
          setShowConfirm(false);
          toast.success("Investment confirmed!");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to invest.");
        },
      },
    );
  };

  const businessName = listing.business_profiles?.businessName || "Business";
  const businessUserId = listing.business_profiles?.userId;
  const sector = listing.business_profiles?.sector || "Sector";
  const tier = listing.business_profiles?.tier || "1";
  const rating = listing.bridge_ratings;
  const standing = rating?.standing || rating?.overallStanding || "Seed";
  const score = rating?.overallScore || rating?.score || "N/A";
  const components = getRatingBreakdown(rating);

  const aiProfile = parseAiProfile(listing.aiProfile);
  const narrative = toParagraphs(aiProfile?.narrative || aiProfile?.summary || listing.aiProfile);
  const story = narrative.length > 0 ? narrative : [];
  const flaggedNotes = toParagraphs(aiProfile?.flaggedNotes);
  const tranches = getTrancheDisplay(listing, aiProfile);
  const trustSignals = getTrustSignals(listing, aiProfile);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        to={PAGES.DASHBOARD_INVESTOR}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to listings
      </Link>

      <header className="mt-6 rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                {sector}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                Tier {tier}
              </span>
            </div>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">{businessName}</h1>
          </div>
          {businessUserId && (
            <Link
              to={PAGES.BUSINESS_ID}
              params={{ id: businessUserId }}
              className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-medium text-primary hover:bg-secondary transition-colors"
            >
              View business profile →
            </Link>
          )}
        </div>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-primary px-5 py-3 text-primary-foreground">
          <span className="text-xs uppercase tracking-wider opacity-80">Bridge Rating</span>
          <span className="font-display text-2xl">{standing}</span>
          {/* <span className="opacity-60">·</span>
          <span className="font-display text-2xl">{score}</span> */}
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between text-sm">
            <div>
              <div className="font-display text-3xl">{formatNaira(listing.totalCommitted)}</div>
              <div className="text-muted-foreground">
                committed of {formatNaira(listing.capitalRequested)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{listing.investorCount || 0} investors</div>
              <div className="text-muted-foreground">
                {formatNaira(Math.max(0, listing.capitalRequested - listing.totalCommitted))}{" "}
                remaining
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${fundedPct}%` }} />
          </div>
        </div>
      </header>

      <div
        className={`mt-8 grid gap-8 ${role === "investor" ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}
      >
        <div className="min-w-0 space-y-8">
          {story.length > 0 && (
            <section className="min-w-0 rounded-2xl border border-border bg-card p-8">
              <h2 className="font-display text-2xl">The story</h2>
              <div className="prose prose-sm mt-4 max-w-none wrap-anywhere text-foreground/90">
                {story.map((p: string, i: number) => (
                  <p key={i} className="mt-4 wrap-anywhere leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
              {flaggedNotes.length > 0 && (
                <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-warning">
                    Flagged by AI
                  </div>
                  {flaggedNotes.map((n: string, i: number) => (
                    <p key={i} className="mt-2 wrap-anywhere text-sm">
                      {n}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}

          {(listing.useOfFunds || listing.expectedImpact) && (
            <section className="grid gap-4 md:grid-cols-2">
              {listing.useOfFunds && (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
                  <div className="absolute left-0 top-0 h-full w-1 bg-linear-to-b from-primary via-primary/60 to-primary/20" />
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                      <Banknote className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-display text-lg">Use of funds</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/80 line-clamp-2">
                    {listing.useOfFunds}
                  </p>
                </div>
              )}
              {listing.expectedImpact && (
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
                  <div className="absolute left-0 top-0 h-full w-1 bg-linear-to-b from-success via-success/60 to-success/20" />
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/10">
                      <Target className="h-5 w-5 text-success" />
                    </div>
                    <h3 className="font-display text-lg">Expected impact</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/80 line-clamp-2">
                    {listing.expectedImpact}
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Deal terms</h2>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <Term label="Capital requested" value={formatNairaFull(listing.capitalRequested)} />
              <Term label="Revenue share" value={`${listing.revenueSharePercent}%`} />
              <Term
                label="Total return"
                value={`${formatNairaFull(listing.totalReturnAmount)} (${listing.totalReturnPercent}%)`}
              />
              <Term label="Target horizon" value={`${listing.targetRepaymentMonths} months`} />
            </dl>
            <div className="mt-8">
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
          </section>

          <section className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Trust signals</h2>
            <ul className="mt-6 divide-y divide-border">
              {trustSignals.map((s: any) => (
                <li key={s.label} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium">{s.label}</span>
                    {s.detail && <span className="ml-2 text-muted-foreground">{s.detail}</span>}
                  </div>
                  <span className={s.status === "pass" ? "text-success" : "text-warning"}>
                    {s.status === "pass" ? "✓ Verified" : "⚠ Flagged"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {components.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-8">
              <h2 className="font-display text-2xl">Bridge Rating breakdown</h2>
              <div className="mt-2 text-sm text-muted-foreground">
                Standing <span className="text-foreground font-medium">{standing}</span> · Score{" "}
                <span className="text-foreground font-medium">{score}</span>
              </div>
              <div className="mt-6 space-y-3">
                {components.map((c: any) => {
                  const max = Math.max(...components.map((x: any) => x.contribution), 1);
                  const pct = (c.contribution / max) * 100;
                  return (
                    <div key={c.label}>
                      <div className="flex justify-between text-sm">
                        <span>{c.label}</span>
                        <span className="text-muted-foreground">{c.contribution}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {role === "investor" &&
          (() => {
            const remainingKobo = Math.max(
              0,
              (listing.capitalRequested || 0) - (listing.totalCommitted || 0),
            );
            const maxInvestNaira = Math.floor(remainingKobo / 100);

            return (
              <aside className="lg:sticky lg:top-24 self-start rounded-2xl border border-border bg-card p-6">
                <h3 className="font-display text-xl">Invest in this deal</h3>
                <label className="mt-4 block text-xs font-medium text-muted-foreground">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  min={50000}
                  max={maxInvestNaira}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Min ₦50,000</span>
                  <span>Max {formatNairaFull(remainingKobo)}</span>
                </div>

                <div className="mt-6 space-y-3 rounded-xl bg-secondary/60 p-4 text-sm">
                  <Row label="Expected return" value={formatNairaFull(projected.expected * 100)} />
                  <Row label="Total receivable" value={formatNairaFull(projected.total * 100)} />
                  <Row label="Projected timeline" value={`${projected.months} months`} />
                </div>

                <button
                  onClick={handleInvest}
                  disabled={amount < 50000 || amount > maxInvestNaira}
                  className="mt-6 w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Commit capital
                </button>
              </aside>
            );
          })()}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="font-display text-2xl">Confirm your commitment</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Business" value={businessName} />
              <Row label="Amount" value={formatNairaFull(amount * 100)} />
              <Row label="Expected return" value={formatNairaFull(projected.expected * 100)} />
              <Row label="Projected timeline" value={`${projected.months} months`} />
              <Row
                label="Default pool deduction (4%)"
                value={formatNairaFull(Math.round(amount * 100 * 0.04))}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary"
                disabled={investMut.isPending}
              >
                Go back
              </button>
              <button
                onClick={confirmInvest}
                disabled={investMut.isPending}
                className="flex-1 flex justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {investMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm and commit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Term = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
};

export const Route = createFileRoute("/listings/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Listing — Bridge` },
      {
        name: "description",
        content: `Listing detail on Bridge for ${params.id}.`,
      },
    ],
  }),
  component: ListingDetailPage,
});
