/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useInvestorWallet,
  useInvestorDeals,
  useInvestorSummary,
  useInvestorPerformanceChart,
  useListingFunding,
  useListingDetail,
  type InvestorReturnsPeriod,
} from "@/hooks/queries";
import { useProtectedRoute } from "@/hooks/use-protected-route";
import {
  useDepositMutation,
  useInvestorWalletCheckoutMutation,
  usePayoutTransferMutation,
  useCancelInvestmentMutation,
} from "@/hooks/mutations";
import { formatNaira, formatNairaFull, formatChartAxisLabel } from "@/lib/utils";
import { getEmailFromBridgeAuthToken, openInvestorSquadWalletCheckout } from "@/lib/squad-widget";
import { PAGES } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Deals from GET /investor/:id/deals are often flat (listingId, amounts, status, …).
 * When `listings` is missing or not populated, load listing detail for sector, rating,
 * tranches, etc. `businessName` on the deal is preferred and avoids waiting on listing for the title.
 */
const useDealListing = (d: any) => {
  const embedded = d.listings;
  const listingId = (d.listingId ?? d.listing_id ?? embedded?.id) as string | undefined;
  const hasRichEmbedded =
    embedded != null &&
    typeof embedded === "object" &&
    (embedded.business_profiles != null ||
      embedded.sector != null ||
      embedded.aiProfile != null ||
      embedded.useOfFunds != null ||
      embedded.capitalRequested != null);
  const fetchId = !hasRichEmbedded && listingId ? listingId : "";
  const { data: fetched, isLoading } = useListingDetail(fetchId);
  const listing = hasRichEmbedded ? embedded : (fetched ?? {});
  return {
    listingId,
    listing,
    isListingLoading: Boolean(fetchId) && isLoading,
  };
};

const hasDealBusinessName = (d: any) => {
  const n = d.businessName ?? d.business_name;
  return typeof n === "string" && n.trim().length > 0;
};

/** Prefer `businessName` / `business_name` on the deal; then nested listing profile. */
const dealBusinessName = (d: any, listing?: any) => {
  if (hasDealBusinessName(d)) return String(d.businessName ?? d.business_name).trim();
  const fromListing = listing?.business_profiles?.businessName;
  if (typeof fromListing === "string" && fromListing.trim()) return fromListing.trim();
  return "Business";
};

const Portfolio = () => {
  useProtectedRoute("investor");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"inactive" | "active" | "completed" | "defaulted">("inactive");
  const [withdraw, setWithdraw] = useState(false);
  const [fundModal, setFundModal] = useState(false);
  const [fundTab, setFundTab] = useState<"checkout" | "sandbox">("checkout");
  const [fundAmount, setFundAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: summary, isLoading: isSummaryLoading } = useInvestorSummary();
  const { data: wallet, isLoading: isWalletLoading } = useInvestorWallet();
  const { data: dealsData, isLoading: isDealsLoading } = useInvestorDeals();
  const depositMut = useDepositMutation();
  const walletCheckoutMut = useInvestorWalletCheckoutMutation();
  const transferMut = usePayoutTransferMutation();

  const deals = dealsData || [];
  const inactiveDeals = deals.filter((d: any) => d.status === "inactive");
  const activeDeals = deals.filter((d: any) => d.status === "active");
  const completedDeals = deals.filter((d: any) => d.status === "completed");
  const defaultedDeals = deals.filter((d: any) => d.status === "defaulted");

  const completedDeployed = completedDeals.reduce(
    (sum: number, d: any) => sum + Number(d.amountCommitted ?? 0),
    0,
  );
  const completedReturns = completedDeals.reduce(
    (sum: number, d: any) => sum + Number(d.totalReturnReceived ?? 0),
    0,
  );
  const overallRoi =
    completedDeployed > 0
      ? ((completedReturns - completedDeployed) / completedDeployed) * 100
      : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl">Your portfolio</h1>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {isSummaryLoading ? (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Stat
              label="Capital deployed"
              value={formatNairaFull(summary?.totalCapitalDeployed || 0)}
            />
            <Stat
              label="Returns received"
              value={formatNairaFull(summary?.totalReturnsReceived || 0)}
            />
            <Stat label="Completed" value={String(completedDeals.length)} />
            <Stat label="Funding" value={String(inactiveDeals.length)} />
            <Stat label="Active" value={String(activeDeals.length)} />
            <Stat
              label="Overall ROI"
              value={overallRoi == null ? "—" : `${overallRoi.toFixed(1)}%`}
            />
          </>
        )}
      </section>

      <section className="mt-6 grid gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Squad wallet balance
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div className="font-display text-3xl">
              {isWalletLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                formatNairaFull(wallet?.availableBalance || 0)
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFundModal(true)}
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary"
              >
                Fund Wallet
              </button>
              <button
                onClick={() => setWithdraw(true)}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
        {/* <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Default pool balance
          </div>
          <div className="mt-1 font-display text-3xl">
            {isWalletLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              formatNairaFull(wallet?.defaultPoolBalance || 0)
            )}
          </div>
        </div> */}
      </section>

      <InvestorChartsSection />

      <section className="mt-10">
        <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-sm">
          {(
            [
              ["inactive", "Inactive"],
              ["active", "Active"],
              ["completed", "Completed"],
              ["defaulted", "Defaulted"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                "rounded-full px-4 py-1.5 " +
                (tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {isDealsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {tab === "inactive" &&
              (inactiveDeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No commitments awaiting funding. Browse listings to invest.
                </div>
              ) : (
                inactiveDeals.map((d: any) => <InactiveDealCard key={d.id} d={d} />)
              ))}

            {tab === "active" &&
              (activeDeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No active investments.
                </div>
              ) : (
                activeDeals.map((d: any) => <ActiveCard key={d.id} d={d} />)
              ))}

            {tab === "completed" &&
              (completedDeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No completed deals yet.
                </div>
              ) : (
                completedDeals.map((d: any) => <CompletedDealCard key={d.id} d={d} />)
              ))}

            {tab === "defaulted" &&
              (defaultedDeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No defaults — your default pool is ready if anything ever does.
                </div>
              ) : (
                defaultedDeals.map((d: any) => <DefaultedDealCard key={d.id} d={d} />)
              ))}
          </div>
        )}
      </section>

      {withdraw && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl">Withdraw to bank</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Funds will be sent to the bank account you provided during registration.
                </p>
              </div>
              <button
                onClick={() => setWithdraw(false)}
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
                    {
                      amount: String(amountKobo),
                    },
                    {
                      onSuccess: () => {
                        toast.success("Withdrawal initiated.");
                        setWithdraw(false);
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
      {fundModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
            <h3 className="font-display text-2xl text-foreground">Fund your wallet</h3>

            <div className="mt-4 inline-flex rounded-full border border-border bg-secondary/40 p-0.5 text-sm">
              <button
                type="button"
                onClick={() => setFundTab("checkout")}
                className={
                  "rounded-full px-4 py-1.5 " +
                  (fundTab === "checkout"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground")
                }
              >
                Squad checkout
              </button>
              <button
                type="button"
                onClick={() => setFundTab("sandbox")}
                className={
                  "rounded-full px-4 py-1.5 " +
                  (fundTab === "sandbox"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground")
                }
              >
                Simulate deposit
              </button>
            </div>

            {fundTab === "checkout" && (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter how much you want to add. The Squad payment window will open so you can pay
                  with card, USSD, or bank transfer. Your wallet is credited after the payment
                  clears.
                </p>
                <label className="block">
                  <span className="text-sm font-medium">Amount (₦)</span>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <button
                  type="button"
                  disabled={walletCheckoutMut.isPending || !fundAmount || Number(fundAmount) <= 0}
                  onClick={() => {
                    const amountKobo = Math.round(Number(fundAmount) * 100);
                    if (!amountKobo || amountKobo <= 0) {
                      toast.error("Enter a valid amount.");
                      return;
                    }
                    walletCheckoutMut.mutate(amountKobo, {
                      onSuccess: async (data) => {
                        const email = getEmailFromBridgeAuthToken();
                        try {
                          await openInvestorSquadWalletCheckout({
                            amountKobo,
                            session: data,
                            emailFallback: email,
                            onClose: () => {},
                            onSuccess: () => {
                              toast.success("Payment completed. Your wallet will update shortly.");
                              void queryClient.invalidateQueries({ queryKey: ["investor-wallet"] });
                              void queryClient.invalidateQueries({
                                queryKey: ["investor-summary"],
                              });
                            },
                          });
                        } catch (e) {
                          toast.error(
                            e instanceof Error ? e.message : "Could not open Squad checkout.",
                          );
                        }
                      },
                      onError: (err) => {
                        toast.error(err instanceof Error ? err.message : "Checkout failed.");
                      },
                    });
                  }}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {walletCheckoutMut.isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Continue to secure checkout"
                  )}
                </button>
              </div>
            )}

            {fundTab === "sandbox" && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-warning">
                    Sandbox only
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Simulates an external bank deposit into your virtual account. Credits appear
                    instantly in your ledger balance.
                  </p>
                </div>
                <label className="block">
                  <span className="text-sm font-medium">Amount (₦)</span>
                  <input
                    type="number"
                    min={1}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <button
                  disabled={depositMut.isPending || !depositAmount || Number(depositAmount) <= 0}
                  onClick={() => {
                    const amountKobo = Math.round(Number(depositAmount) * 100);
                    depositMut.mutate(amountKobo, {
                      onSuccess: () => {
                        toast.success(
                          `₦${Number(depositAmount).toLocaleString()} deposited successfully.`,
                        );
                        setDepositAmount("");
                      },
                      onError: (err) => {
                        toast.error(err.message || "Deposit simulation failed.");
                      },
                    });
                  }}
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {depositMut.isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Simulate Deposit"
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setFundModal(false);
                setTimeout(() => {
                  setFundTab("checkout");
                  setFundAmount("");
                  setDepositAmount("");
                }, 300);
              }}
              className="mt-8 w-full rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const parseAiProfileLocal = (aiProfile: any) => {
  if (!aiProfile) return null;
  if (typeof aiProfile === "object") return aiProfile;
  if (typeof aiProfile === "string") {
    try {
      return JSON.parse(aiProfile);
    } catch {
      return { narrative: aiProfile };
    }
  }
  return null;
};

const InactiveDealCard = ({ d }: { d: any }) => {
  const { listing, listingId, isListingLoading } = useDealListing(d);
  const cancelMut = useCancelInvestmentMutation();
  const { data: funding, isLoading: isFundingLoading } = useListingFunding(
    listingId,
    d.status === "inactive",
  );

  const capital = funding?.capitalRequested ?? listing.capitalRequested ?? 0;
  const committed = funding?.totalCommitted ?? listing.totalCommitted ?? 0;
  const investors = funding?.investorCount ?? listing.investorCount ?? 0;
  const fundedPct = capital > 0 ? Math.min(100, Math.round((committed / capital) * 100)) : 0;

  const businessName = dealBusinessName(d, listing);
  const titlePending = !hasDealBusinessName(d) && isListingLoading;
  const sector = listing.sector || "—";
  const tier = listing.business_profiles?.tier ?? listing.tier ?? 1;
  const standing =
    listing.bridge_ratings?.standing || listing.bridge_ratings?.overallStanding || "Seed";
  const ai = parseAiProfileLocal(listing.aiProfile);
  const narrative = Array.isArray(ai?.narrative)
    ? ai.narrative[0]
    : typeof ai?.narrative === "string"
      ? ai.narrative
      : null;
  const blurb = narrative || listing.useOfFunds || "You have a commitment on this listing.";
  const targetMonths =
    d.targetRepaymentMonths ?? listing.targetRepaymentMonths ?? listing.targetMonths ?? 0;

  const handleCancel = () => {
    if (!window.confirm("Cancel this commitment? Your capital will be refunded to your wallet.")) {
      return;
    }
    cancelMut.mutate(d.id, {
      onSuccess: (data) => {
        toast.success(data.message || "Investment cancelled.");
      },
      onError: (err: any) => {
        toast.error(err.message || "Could not cancel.");
      },
    });
  };

  return (
    <div className="rounded-3xl border border-dashed border-primary/40 bg-card p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              {sector}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Tier {tier}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
              Awaiting full funding
            </span>
          </div>
          <h3 className="mt-3 font-display text-2xl md:text-3xl">
            {titlePending ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Loading…
              </span>
            ) : (
              businessName
            )}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{blurb}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Target horizon · {targetMonths} months ·{" "}
            <span className="font-medium text-foreground">{investors}</span> investor
            {investors === 1 ? "" : "s"} on this listing
            {isFundingLoading ? " · refreshing totals…" : ""}
          </p>
        </div>
        {listingId && (
          <Link
            to={PAGES.LISTINGS_ID}
            params={{ id: listingId }}
            className="shrink-0 rounded-xl border border-input bg-background px-4 py-2 text-xs font-medium text-primary hover:bg-secondary transition-colors"
          >
            View listing →
          </Link>
        )}
      </div>

      <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-primary px-5 py-3 text-primary-foreground">
        <span className="text-xs uppercase tracking-wider opacity-80">Bridge rating</span>
        <span className="font-display text-2xl">{standing}</span>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4 text-sm">
          <div>
            <div className="font-display text-3xl">{formatNaira(committed)}</div>
            <div className="text-muted-foreground">committed of {formatNaira(capital)}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              {investors} investor{investors === 1 ? "" : "s"}
            </div>
            <div className="text-muted-foreground">
              {formatNaira(Math.max(0, capital - committed))} remaining
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${fundedPct}%` }} />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Your commitment
          </div>
          <div className="mt-1 font-display text-xl">{formatNairaFull(d.amountCommitted)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={cancelMut.isPending}
            onClick={handleCancel}
            className="rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {cancelMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin inline" />
            ) : (
              "Cancel commitment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ActiveCard = ({ d }: { d: any }) => {
  const [open, setOpen] = useState(false);
  const { listing, isListingLoading } = useDealListing(d);

  const businessName = dealBusinessName(d, listing);
  const titlePending = !hasDealBusinessName(d) && isListingLoading;
  const standing =
    listing.bridge_ratings?.standing || listing.bridge_ratings?.overallStanding || "Seed";
  // The backend might not give `sweeps` and `tranches` directly in the deal object,
  // we would usually need to fetch `/deals/:listingId/sweeps` but we will safely fallback.
  const sweeps = d.sweeps || [];
  const ai = parseAiProfileLocal(listing.aiProfile);
  const tranches = Array.isArray(ai?.tranches)
    ? ai.tranches
    : Array.isArray(listing.aiProfile?.tranches)
      ? listing.aiProfile.tranches
      : [];

  const pct =
    d.totalReturnDue > 0
      ? Math.min(100, Math.round((d.totalReturnReceived / d.totalReturnDue) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl">
            {titlePending ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Loading…
              </span>
            ) : (
              businessName
            )}
          </h3>
          <div className="mt-1 text-sm text-muted-foreground">
            Standing · {standing} · target{" "}
            {d.targetRepaymentMonths ?? listing.targetRepaymentMonths ?? 0} months
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Invested</div>
          <div className="font-display text-lg">{formatNairaFull(d.amountCommitted)}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatNairaFull(d.totalReturnReceived)} received</span>
          <span>
            {pct}% of {formatNairaFull(d.totalReturnDue)}
          </span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button onClick={() => setOpen(!open)} className="mt-4 text-sm text-primary hover:underline">
        {open ? "Hide details" : "Show sweep history & tranches"}
      </button>
      {open && (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sweep history
            </div>
            {sweeps.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No sweeps yet.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {sweeps.map((s: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                    <span className="font-medium">{formatNairaFull(s.amountKobo || 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tranche status
            </div>
            {tranches.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No tranches found.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {tranches.map((t: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span>{t.label}</span>
                    <span className={t.released ? "text-success" : "text-muted-foreground"}>
                      {t.released ? "Released" : "Locked"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
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

const Mini = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
};

const CompletedDealCard = ({ d }: { d: any }) => {
  const businessName = dealBusinessName(d, null);
  const targetMonths = d.targetRepaymentMonths ?? 0;
  const returnPct =
    d.amountCommitted > 0
      ? Math.round(((d.totalReturnReceived - d.amountCommitted) / d.amountCommitted) * 1000) / 10
      : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl">{businessName}</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            Completed in {targetMonths} months
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl">{formatNairaFull(d.totalReturnReceived)}</div>
          <div className="text-xs text-success">+{returnPct}% return</div>
        </div>
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Invested {formatNairaFull(d.amountCommitted)}
      </div>
    </div>
  );
};

const DefaultedDealCard = ({ d }: { d: any }) => {
  const businessName = dealBusinessName(d, null);
  const netLoss = d.amountCommitted - d.totalReturnReceived;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">{businessName}</h3>
        <span className="text-xs text-destructive">
          Net loss {formatNairaFull(Math.max(0, netLoss))}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <Mini label="Invested" value={formatNairaFull(d.amountCommitted)} />
        <Mini label="Recovered" value={formatNairaFull(d.totalReturnReceived)} />
        <Mini label="Net loss" value={formatNairaFull(Math.max(0, netLoss))} />
      </div>
    </div>
  );
};

const InvestorChartsSection = () => {
  const now = new Date();
  const [period, setPeriod] = useState<InvestorReturnsPeriod>("hourly");
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
  } = useInvestorPerformanceChart(
    period,
    period === "yearly" ? undefined : year,
    period === "daily" || period === "hourly" ? month : undefined,
    period === "hourly" ? day : undefined,
  );

  const rawData = chartResponse?.data ?? [];
  const hasData = rawData.length > 0;

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const maxPeriodReturns = Math.max(...rawData.map((d) => d.totalReturnsReceived), 1);
  const maxCumulative = Math.max(...rawData.map((d) => d.cumulativeReturns), 1);

  type ChartPoint = {
    x: number;
    y: number;
    val: number;
    label: string;
  };

  const getChartPoints = (
    key: "totalReturnsReceived" | "cumulativeReturns",
    maxVal: number,
  ): ChartPoint[] => {
    const len = rawData.length;
    return rawData.map((d, idx) => {
      const val = d[key] || 0;
      const x = 30 + (idx / Math.max(1, len - 1)) * 340;
      const y = 130 - (val / maxVal) * 100;
      return { x, y, val, label: formatChartAxisLabel(d.label, period) };
    });
  };

  const periodPoints = getChartPoints("totalReturnsReceived", maxPeriodReturns);
  const cumulativePoints = getChartPoints("cumulativeReturns", maxCumulative);

  const periodPolylineStr = periodPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const periodAreaStr =
    periodPoints.length > 0
      ? `${periodPoints[0].x},130 ${periodPolylineStr} ${periodPoints[periodPoints.length - 1].x},130`
      : "";

  const cumulativePolylineStr = cumulativePoints.map((p) => `${p.x},${p.y}`).join(" ");
  const cumulativeAreaStr =
    cumulativePoints.length > 0
      ? `${cumulativePoints[0].x},130 ${cumulativePolylineStr} ${cumulativePoints[cumulativePoints.length - 1].x},130`
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
    <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl text-foreground">Performance analytics</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as InvestorReturnsPeriod)}
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
          {error instanceof Error ? error.message : "Could not load returns data."}
        </div>
      ) : !hasData ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No returns data for this selection yet.
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Returns received (period)
            </div>

            <div className="relative w-full pt-2">
              <svg viewBox="0 0 400 160" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="capGradient" x1="0" y1="0" x2="0" y2="1">
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

                {periodAreaStr && <polygon points={periodAreaStr} fill="url(#capGradient)" />}

                {periodPolylineStr && (
                  <polyline
                    points={periodPolylineStr}
                    fill="none"
                    stroke="var(--color-primary, #003cbb)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {periodPoints.map((p, idx) => (
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

              <div className="flex justify-between px-[7.5%] mt-2 text-[10px] text-muted-foreground">
                {periodPoints.map((p, idx) => (
                  <span key={idx} className="truncate max-w-[50px] text-center">
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-secondary/10 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-success/5 rounded-full blur-2xl pointer-events-none" />
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Cumulative returns
            </div>

            <div className="relative w-full pt-2">
              <svg viewBox="0 0 400 160" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="retGradient" x1="0" y1="0" x2="0" y2="1">
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

                {cumulativeAreaStr && (
                  <polygon points={cumulativeAreaStr} fill="url(#retGradient)" />
                )}

                {cumulativePolylineStr && (
                  <polyline
                    points={cumulativePolylineStr}
                    fill="none"
                    stroke="var(--color-success, #10b981)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {cumulativePoints.map((p, idx) => (
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

              <div className="flex justify-between px-[7.5%] mt-2 text-[10px] text-muted-foreground">
                {cumulativePoints.map((p, idx) => (
                  <span key={idx} className="truncate max-w-[50px] text-center">
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

export const Route = createFileRoute("/dashboard/investor/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Bridge" }] }),
  component: Portfolio,
});
