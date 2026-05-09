import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getListingDetail, formatNairaFull, formatNaira } from "@/lib/mock-data";
import { useMockAuth } from "@/lib/mock-auth";
import { PAGES } from "@/lib/constants";

const ListingDetailPage = () => {
  const { id } = Route.useParams();
  const listing = getListingDetail(id);
  const { role, setRole } = useMockAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(50_000);
  const [showConfirm, setShowConfirm] = useState(false);

  const projected = useMemo(() => {
    const expected = Math.round(amount * (listing.totalReturnPct / 100));
    return { expected, total: amount + expected, months: listing.targetMonths };
  }, [amount, listing.totalReturnPct, listing.targetMonths]);

  const fundedPct = Math.min(100, Math.round((listing.committed / listing.capitalRequested) * 100));

  const handleInvest = () => {
    if (role !== "investor") {
      navigate({ to: PAGES.REGISTER_INVESTOR });
      return;
    }
    setShowConfirm(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        to={PAGES.DASHBOARD_INVESTOR}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to listings
      </Link>

      <header className="mt-6 rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
            {listing.sector}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            {listing.tier}
          </span>
        </div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">{listing.business}</h1>
        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-primary px-5 py-3 text-primary-foreground">
          <span className="text-xs uppercase tracking-wider opacity-80">Bridge Rating</span>
          <span className="font-display text-2xl">{listing.rating.overallStanding}</span>
          <span className="opacity-60">·</span>
          <span className="font-display text-2xl">{listing.rating.score}</span>
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between text-sm">
            <div>
              <div className="font-display text-3xl">{formatNaira(listing.committed)}</div>
              <div className="text-muted-foreground">
                committed of {formatNaira(listing.capitalRequested)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{listing.investorsCount} investors</div>
              <div className="text-muted-foreground">
                {formatNaira(listing.capitalRequested - listing.committed)} remaining
              </div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${fundedPct}%` }} />
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl">The story</h2>
            <div className="prose prose-sm mt-4 max-w-none text-foreground/90">
              {listing.narrative.map((p, i) => (
                <p key={i} className="mt-4 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
            {listing.flaggedNotes.length > 0 && (
              <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4">
                <div className="text-xs font-medium uppercase tracking-wider text-warning">
                  Flagged by AI
                </div>
                {listing.flaggedNotes.map((n, i) => (
                  <p key={i} className="mt-2 text-sm">
                    {n}
                  </p>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Deal terms</h2>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <Term label="Capital requested" value={formatNairaFull(listing.capitalRequested)} />
              <Term label="Revenue share" value={`${listing.revenueSharePct}%`} />
              <Term
                label="Total return"
                value={`${formatNairaFull(listing.totalReturnNaira)} (${listing.totalReturnPct}%)`}
              />
              <Term label="Target horizon" value={`${listing.targetMonths} months`} />
              <Term label="Maximum duration" value={`${listing.maxMonths} months`} />
            </dl>
            <div className="mt-8">
              <div className="text-sm font-medium">Tranche structure</div>
              <ol className="mt-3 space-y-3">
                {listing.tranches.map((t) => (
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
              {listing.trustSignals.map((s) => (
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

          <section className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-2xl">Bridge Rating breakdown</h2>
            <div className="mt-2 text-sm text-muted-foreground">
              Standing{" "}
              <span className="text-foreground font-medium">{listing.rating.overallStanding}</span>{" "}
              · Score <span className="text-foreground font-medium">{listing.rating.score}</span>
            </div>
            <div className="mt-6 space-y-3">
              {listing.rating.components.map((c) => {
                const max = Math.max(...listing.rating.components.map((x) => x.contribution));
                const pct = (c.contribution / max) * 100;
                return (
                  <div key={c.label}>
                    <div className="flex justify-between text-sm">
                      <span>{c.label}</span>
                      <span className="text-muted-foreground">{c.contribution}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-secondary">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 self-start rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-xl">Invest in this deal</h3>
          <label className="mt-4 block text-xs font-medium text-muted-foreground">Amount (₦)</label>
          <input
            type="number"
            min={listing.minimumInvestment}
            step={5000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-1 text-xs text-muted-foreground">
            Minimum {formatNairaFull(listing.minimumInvestment)}
          </div>

          <div className="mt-6 space-y-3 rounded-xl bg-secondary/60 p-4 text-sm">
            <Row label="Expected return" value={formatNairaFull(projected.expected)} />
            <Row label="Total receivable" value={formatNairaFull(projected.total)} />
            <Row label="Projected timeline" value={`${projected.months} months`} />
          </div>

          <button
            onClick={handleInvest}
            disabled={amount < listing.minimumInvestment}
            className="mt-6 w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {role === "investor" ? "Commit capital" : "Sign up to invest"}
          </button>
          {role === "guest" && (
            <button
              onClick={() => setRole("investor")}
              className="mt-2 w-full text-xs text-muted-foreground hover:text-foreground"
            >
              Or switch to investor (mock)
            </button>
          )}
        </aside>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="font-display text-2xl">Confirm your commitment</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Business" value={listing.business} />
              <Row label="Amount" value={formatNairaFull(amount)} />
              <Row label="Expected return" value={formatNairaFull(projected.expected)} />
              <Row label="Projected timeline" value={`${projected.months} months`} />
              <Row
                label="Default pool deduction (4%)"
                value={formatNairaFull(Math.round(amount * 0.04))}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary"
              >
                Go back
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  alert("Squad transfer initiated (mock).");
                }}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Confirm and commit
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
