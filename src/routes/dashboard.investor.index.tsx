/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  useInvestorSummary,
  useInvestorActivity,
  useInvestorMatchedListings,
  useListings,
} from "@/hooks/queries";
import { formatNaira } from "@/lib/utils";
import { PAGES, SECTORS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

const InvestorDashboard = () => {
  const [tab, setTab] = useState<"foryou" | "all">("foryou");
  const { data: summary, isLoading: isSummaryLoading } = useInvestorSummary();
  const { data: activity, isLoading: isActivityLoading } = useInvestorActivity();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl">Welcome back</h1>

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {isSummaryLoading || !summary ? (
          <div className="col-span-full flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          [
            {
              label: "Capital deployed",
              value: formatNaira(summary.totalDeployedKobo),
            },
            {
              label: "Returns received",
              value: formatNaira(summary.totalReturnsReceivedKobo),
            },
            { label: "Active deals", value: String(summary.activeDealsCount) },
            {
              label: "Default pool balance",
              value: formatNaira(summary.defaultPoolBalanceKobo),
            },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="font-display text-2xl">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Recent activity</h2>
          <Link to={PAGES.NOTIFICATIONS} className="text-sm text-primary hover:underline">
            All notifications →
          </Link>
        </div>
        {isActivityLoading || !activity ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : activity.length === 0 ? (
          <div className="py-6 text-sm text-muted-foreground">No recent activity.</div>
        ) : (
          <ul className="mt-4 divide-y divide-border">
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
  const { data: matchedData, isLoading } = useInvestorMatchedListings();

  if (isLoading) {
    return (
      <div className="mt-6 flex justify-center py-10">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const matched = matchedData?.data || [];

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
      {matched.map((l: any) => (
        <Card key={l.id} l={l} />
      ))}
    </div>
  );
};

const AllListings = () => {
  const [sector, setSector] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const [standing, setStanding] = useState<string>("");
  const [sort, setSort] = useState("newest");

  // Format params for the API hook
  const params: Record<string, string> = {};
  if (sector) params.sector = sector;
  if (tier) params.tier = tier;
  if (standing) params.standing = standing;
  if (sort) params.sort = sort;

  const { data, isLoading } = useListings(params);

  const filtered = data?.data || [];

  const hasFilters = sector || tier || standing;
  const resetFilters = () => {
    setSector("");
    setTier("");
    setStanding("");
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col text-xs">
              <span className="text-muted-foreground font-medium mb-1">Sector</span>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">All Sectors</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-xs">
              <span className="text-muted-foreground font-medium mb-1">Tier</span>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">Any Tier</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
              </select>
            </label>

            <label className="flex flex-col text-xs">
              <span className="text-muted-foreground font-medium mb-1">Standing</span>
              <select
                value={standing}
                onChange={(e) => setStanding(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">Any Standing</option>
                <option value="Seed">Seed</option>
                <option value="Sprout">Sprout</option>
                <option value="Established">Established</option>
                <option value="Anchor">Anchor</option>
              </select>
            </label>

            {hasFilters && (
              <button
                onClick={resetFilters}
                className="self-end rounded-xl border border-dashed border-input bg-secondary px-3 py-2 text-xs hover:bg-secondary/80 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          <label className="flex flex-col text-xs">
            <span className="text-muted-foreground font-medium mb-1">Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="highest_bridge_rating">Highest Bridge Rating</option>
              <option value="highest_return">Highest return</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No listings match those filters.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l: any) => (
            <Card key={l.id} l={l} />
          ))}
        </div>
      )}
    </div>
  );
};

const Card = ({ l }: { l: any }) => {
  const sector = l.business_profiles?.sector || "Sector";
  const tier = l.business_profiles?.tier || "1";
  const standing = l.bridge_ratings?.overallStanding || "Seed";
  const businessName = l.business_profiles?.businessName || "Business";
  const narrative = l.aiProfile?.narrative?.[0] || l.useOfFunds || "";

  return (
    <Link
      to={PAGES.LISTINGS_ID}
      params={{ id: l.id }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex items-center gap-1.5 text-xs">
        <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
          {sector}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Tier {tier}</span>
        <span className="ml-auto text-muted-foreground">{standing}</span>
      </div>
      <h3 className="mt-3 font-display text-xl">{businessName}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{narrative}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
        <Stat label="Capital" value={formatNaira(l.capitalRequested)} />
        <Stat label="Rev share" value={`${l.revenueSharePercent}%`} />
        <Stat label="Return" value={`${l.totalReturnPercent}%`} />
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
