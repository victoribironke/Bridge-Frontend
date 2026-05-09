import { createFileRoute, Link } from "@tanstack/react-router";
import {
  businessActiveListing,
  businessActivity,
  businessProfile,
  businessStats,
  formatNaira,
  formatNairaFull,
} from "@/lib/mock-data";

const BusinessDashboard = () => {
  const r = businessProfile.rating;
  const ratingPct = Math.round(((r.score - r.rangeMin) / (r.rangeMax - r.rangeMin)) * 100);
  const fundedPct = Math.round(
    (businessActiveListing.funded / businessActiveListing.capitalRequested) * 100,
  );

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">{businessProfile.name}</h1>
        <Link to="/dashboard/business/payments" className="text-sm text-primary hover:underline">
          Payment link →
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Bridge Rating
          </div>
          <div className="mt-1 font-display text-4xl">{r.standing}</div>
          <div className="mt-1 text-sm text-muted-foreground">Score {r.score}</div>
          <div className="mt-4 h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${ratingPct}%` }} />
          </div>
          <p className="mt-3 text-sm">{r.needed}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Tier</div>
          <div className="mt-1 inline-flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary font-display text-lg">
              {businessProfile.tier.current}
            </span>
          </div>
          <p className="mt-4 text-sm">{businessProfile.tier.nextRequirement}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Active listing</h2>
          <Link
            to="/listings/$id"
            params={{ id: businessActiveListing.id }}
            className="text-sm text-primary hover:underline"
          >
            View as investors see it →
          </Link>
        </div>
        <div className="mt-4">
          <div className="font-display text-lg">{businessActiveListing.title}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Raising {formatNaira(businessActiveListing.capitalRequested)}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatNaira(businessActiveListing.funded)} funded</span>
              <span>{businessActiveListing.investors} investors</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${fundedPct}%` }} />
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {businessActiveListing.tranches.map((t) => (
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
        </div>
      </section>

      <section className="mt-6 grid grid-cols-3 gap-4">
        <Stat label="Total raised" value={formatNaira(businessStats.totalRaised)} />
        <Stat label="Total swept" value={formatNaira(businessStats.totalSwept)} />
        <Stat label="Completed deals" value={String(businessStats.completedDeals)} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Recent activity</h2>
        <ul className="mt-3 divide-y divide-border">
          {businessActivity.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-muted-foreground">{a.detail}</div>
              </div>
              <span className="text-xs text-muted-foreground">{a.ts}</span>
            </li>
          ))}
        </ul>
      </section>
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

export const Route = createFileRoute("/dashboard/business/")({
  head: () => ({ meta: [{ title: "Business dashboard — Bridge" }] }),
  component: BusinessDashboard,
});
