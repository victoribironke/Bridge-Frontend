import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  investorActivity,
  investorSummary,
  listingCards,
  formatNaira,
  SECTORS,
  type ListingCard,
} from "@/lib/mock-data";
import { PAGES } from "@/lib/constants";

const InvestorDashboard = () => {
  const [tab, setTab] = useState<"foryou" | "all">("foryou");
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl">Welcome back</h1>

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Capital deployed",
            value: formatNaira(investorSummary.totalDeployed),
          },
          {
            label: "Returns received",
            value: formatNaira(investorSummary.totalReturns),
          },
          { label: "Active deals", value: String(investorSummary.activeDeals) },
          {
            label: "Default pool balance",
            value: formatNaira(investorSummary.defaultPoolBalance),
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="font-display text-2xl">{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Recent activity</h2>
          <Link to={PAGES.NOTIFICATIONS} className="text-sm text-primary hover:underline">
            All notifications →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {investorActivity.map((a) => (
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

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Listings</h2>
          <Link
            to={PAGES.DASHBOARD_INVESTOR_PORTFOLIO}
            className="text-sm text-primary hover:underline"
          >
            My portfolio →
          </Link>
        </div>
        <div className="mt-4 inline-flex rounded-full border border-border bg-card p-0.5 text-sm">
          {[
            { id: "foryou", label: "For You" },
            { id: "all", label: "All Listings" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as "foryou" | "all")}
              className={
                "rounded-full px-4 py-1.5 " +
                (tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "foryou" ? <ForYou /> : <AllListings />}
      </section>
    </div>
  );
};

const ForYou = () => {
  // Mocked matched ranking: top 3 from cards
  const matched = listingCards.slice(0, 4);
  if (matched.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
        <p className="text-muted-foreground">
          No matches yet.{" "}
          <Link to={PAGES.REGISTER_INVESTOR} className="text-primary hover:underline">
            Set your preferences
          </Link>{" "}
          to see tailored deals.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {matched.map((l) => (
        <Card key={l.id} l={l} />
      ))}
    </div>
  );
};

const AllListings = () => {
  const [sector, setSector] = useState<string[]>([]);
  const [tier, setTier] = useState<string>("");
  const [standing, setStanding] = useState<string[]>([]);
  const [sort, setSort] = useState("best");

  const filtered = useMemo(() => {
    let data = listingCards.slice();
    if (sector.length) data = data.filter((d) => sector.includes(d.sector));
    if (tier) data = data.filter((d) => d.tier === tier);
    if (standing.length) data = data.filter((d) => standing.includes(d.standing));
    switch (sort) {
      case "return":
        data.sort((a, b) => b.targetReturnPct - a.targetReturnPct);
        break;
      case "rating":
        data.sort((a, b) => a.standing.localeCompare(b.standing));
        break;
      case "newest":
        data.reverse();
        break;
    }
    return data;
  }, [sector, tier, standing, sort]);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sector
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(sector, s, setSector)}
                  className={
                    "rounded-full border px-2.5 py-0.5 text-xs " +
                    (sector.includes(s)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tier
            </div>
            <div className="mt-2 flex gap-1.5">
              {["", "Tier 1", "Tier 2", "Tier 3"].map((t) => (
                <button
                  key={t || "all"}
                  onClick={() => setTier(t)}
                  className={
                    "rounded-full border px-2.5 py-0.5 text-xs " +
                    (tier === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border")
                  }
                >
                  {t || "Any"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Standing
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Seed", "Sprout", "Established", "Anchor"].map((s) => (
                <button
                  key={s}
                  onClick={() => toggle(standing, s, setStanding)}
                  className={
                    "rounded-full border px-2.5 py-0.5 text-xs " +
                    (standing.includes(s)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border")
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div className="flex flex-wrap gap-1.5">
            {sector.map((s) => (
              <Tag key={s} label={s} onRemove={() => toggle(sector, s, setSector)} />
            ))}
            {tier && <Tag label={tier} onRemove={() => setTier("")} />}
            {standing.map((s) => (
              <Tag key={s} label={s} onRemove={() => toggle(standing, s, setStanding)} />
            ))}
          </div>
          <label className="text-xs">
            <span className="text-muted-foreground">Sort </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="best">Best match</option>
              <option value="return">Highest return</option>
              <option value="rating">Highest Bridge Rating</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No listings match those filters.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <Card key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
};

const Tag = ({ label, onRemove }: { label: string; onRemove: () => void }) => {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
      {label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">
        ×
      </button>
    </span>
  );
};

const Card = ({ l }: { l: ListingCard }) => {
  return (
    <Link
      to={PAGES.LISTINGS_ID}
      params={{ id: l.id }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex items-center gap-1.5 text-xs">
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
          {l.sector}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{l.tier}</span>
        <span className="ml-auto text-muted-foreground">{l.standing}</span>
      </div>
      <h3 className="mt-3 font-display text-xl">{l.business}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{l.excerpt}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
        <Stat label="Capital" value={formatNaira(l.capitalRequested)} />
        <Stat label="Rev share" value={`${l.revenueSharePct}%`} />
        <Stat label="Return" value={`${l.targetReturnPct}%`} />
      </div>
    </Link>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
};

export const Route = createFileRoute("/dashboard/investor/")({
  head: () => ({ meta: [{ title: "Investor dashboard — Bridge" }] }),
  component: InvestorDashboard,
});
