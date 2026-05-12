/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useInvestorWallet,
  useInvestorDeals,
  useInvestorSummary,
  usePaymentLink,
} from "@/hooks/queries";
import { formatNaira, formatNairaFull } from "@/lib/utils";
import { Loader2, Copy, Check } from "lucide-react";

const Portfolio = () => {
  const [tab, setTab] = useState<"active" | "completed" | "defaulted">("active");
  const [withdraw, setWithdraw] = useState(false);
  const [fundModal, setFundModal] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: summary, isLoading: isSummaryLoading } = useInvestorSummary();
  const { data: wallet, isLoading: isWalletLoading } = useInvestorWallet();
  const { data: dealsData, isLoading: isDealsLoading } = useInvestorDeals();
  const {
    data: paymentData,
    isLoading: isPaymentLoading,
    refetch: refetchPaymentLink,
  } = usePaymentLink();

  const deals = dealsData || [];
  const activeDeals = deals.filter((d: any) => d.status === "active");
  const completedDeals = deals.filter((d: any) => d.status === "completed");
  const defaultedDeals = deals.filter((d: any) => d.status === "defaulted");

  const overallRoi =
    summary?.totalDeployedKobo > 0
      ? ((summary.totalReturnsReceivedKobo - summary.totalDeployedKobo) /
          summary.totalDeployedKobo) *
        100
      : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl">Your portfolio</h1>

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {isSummaryLoading ? (
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Stat label="Capital deployed" value={formatNaira(summary?.totalDeployedKobo || 0)} />
            <Stat
              label="Returns received"
              value={formatNaira(summary?.totalReturnsReceivedKobo || 0)}
            />
            <Stat label="Completed" value={String(completedDeals.length)} />
            <Stat label="Active" value={String(activeDeals.length)} />
            <Stat label="Overall ROI" value={`${overallRoi.toFixed(1)}%`} />
          </>
        )}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
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
                className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
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
        </div>
      </section>

      <section className="mt-10">
        <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-sm">
          {(
            [
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
                completedDeals.map((d: any) => {
                  const businessName = d.listings?.business_profiles?.businessName || "Business";
                  const targetMonths = d.listings?.targetRepaymentMonths || 0;
                  const returnPct = d.listings?.totalReturnPercent || 0;
                  return (
                    <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display text-xl">{businessName}</h3>
                          <div className="mt-1 text-sm text-muted-foreground">
                            Completed in {targetMonths} months
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-xl">
                            {formatNairaFull(d.totalReturnReceived)}
                          </div>
                          <div className="text-xs text-success">+{returnPct}% return</div>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        Invested {formatNairaFull(d.amountCommitted)}
                      </div>
                    </div>
                  );
                })
              ))}

            {tab === "defaulted" &&
              (defaultedDeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  No defaults — your default pool is ready if anything ever does.
                </div>
              ) : (
                defaultedDeals.map((d: any) => {
                  const businessName = d.listings?.business_profiles?.businessName || "Business";
                  const netLoss = d.amountCommitted - d.totalReturnReceived;
                  return (
                    <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
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
                })
              ))}
          </div>
        )}
      </section>

      {withdraw && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="font-display text-2xl">Withdraw to bank</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Withdrawals are coming soon. We'll email you when they're live.
            </p>
            <button
              onClick={() => setWithdraw(false)}
              className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      {fundModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">
            <h3 className="font-display text-2xl text-foreground">Fund your wallet</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Transfer funds directly via bank transfer or instantly generate a secure card/USSD
              payment link.
            </p>

            {isPaymentLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : paymentData ? (
              <div className="mt-6 space-y-4 text-left">
                <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dedicated Virtual Account
                  </div>
                  <div className="mt-2 font-display text-3xl tracking-wider text-primary">
                    {paymentData.virtualAccountNumber || "N/A"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Bank: Squad / GTBank</div>
                </div>

                {!linkGenerated ? (
                  <button
                    onClick={async () => {
                      setIsGenerating(true);
                      await refetchPaymentLink();
                      setIsGenerating(false);
                      setLinkGenerated(true);
                    }}
                    disabled={isGenerating}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-xs font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating link...
                      </>
                    ) : (
                      "Generate payment link"
                    )}
                  </button>
                ) : paymentData.paymentLink ? (
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Instant Checkout Link
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use this unique link to fund via Debit Card, USSD, or Bank Transfers
                      instantly.
                    </p>

                    <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-xl p-2.5">
                      <input
                        type="text"
                        readOnly
                        value={paymentData.paymentLink}
                        className="bg-transparent text-xs text-foreground w-full focus:outline-none truncate"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(paymentData.paymentLink);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        title="Copy link"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <a
                      href={paymentData.paymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Launch Squad Checkout →
                    </a>
                  </div>
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    Payment link generation unavailable.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 py-4 text-center text-sm text-destructive">
                Failed to load dedicated payment details.
              </div>
            )}

            <button
              onClick={() => {
                setFundModal(false);
                // optionally reset generated view state on close
                setTimeout(() => setLinkGenerated(false), 300);
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

const ActiveCard = ({ d }: { d: any }) => {
  const [open, setOpen] = useState(false);

  const businessName = d.listings?.business_profiles?.businessName || "Business";
  const standing = d.listings?.bridge_ratings?.overallStanding || "Seed";
  // The backend might not give `sweeps` and `tranches` directly in the deal object,
  // we would usually need to fetch `/deals/:listingId/sweeps` but we will safely fallback.
  const sweeps = d.sweeps || [];
  const tranches = d.listings?.aiProfile?.tranches || [];

  const pct =
    d.totalReturnDue > 0
      ? Math.min(100, Math.round((d.totalReturnReceived / d.totalReturnDue) * 100))
      : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl">{businessName}</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            Standing · {standing} · target {d.listings?.targetRepaymentMonths} months
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

export const Route = createFileRoute("/dashboard/investor/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Bridge" }] }),
  component: Portfolio,
});
