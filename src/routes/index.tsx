/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useListings } from "@/hooks/queries";
import { formatNaira } from "@/lib/utils";
import { PAGES } from "@/lib/constants";
import { Loader2 } from "lucide-react";

const Index = () => {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <FeaturedListings />
    </>
  );
};

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-grain">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Now live in Lagos, Ibadan, Kano
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-balance md:text-7xl">
            Capital that meets businesses where they already are.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Bridge is a marketplace that turns business revenue into investable assets. Businesses
            raise capital against the income they already earn. Investors back vetted operators and
            get repaid as the business sells. Every deal is structured, scored, and swept
            automatically.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to={PAGES.REGISTER_INVESTOR}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
            >
              I want to invest
            </Link>
            <Link
              to={PAGES.REGISTER_BUSINESS}
              className="inline-flex items-center justify-center rounded-md border border-primary px-6 py-3 text-base font-medium text-primary hover:bg-primary/5"
            >
              I need capital
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stats = () => {
  const items = [
    {
      label: "Businesses funded",
      value: "142",
    },
    {
      label: "Capital deployed",
      value: "₦142,500,000",
    },
    {
      label: "Average investor return",
      value: "24.5%",
    },
    {
      label: "Average repayment time",
      value: "6 months",
    },
  ];

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border md:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="bg-card px-6 py-8">
            <div className="font-display text-3xl md:text-4xl">{it.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const investors = [
    ["Set your preferences", "Pick the sectors, risk tier and timeline that suit you."],
    [
      "Back rated businesses",
      "Every listing is AI-narrated, behaviorally scored, and milestone-protected. ",
    ],
    [
      "Earn as they grow",
      "Returns arrive automatically as a split of every naira the business earns.",
    ],
  ];
  const businesses = [
    [
      "Register and connect your bank",
      "We read your bank inflows and cap your raise to match your revenue.",
    ],
    ["Publish a listing", "Set your capital, duration, expected impact and use of funds."],
    ["Sell as usual", "Customers pay through your link, the platform handles the rest."],
  ];

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-display text-4xl md:text-5xl">How Bridge works</h2>
      <div className="mt-12 grid gap-12 md:grid-cols-2">
        {[
          { title: "For investors", steps: investors },
          { title: "For businesses", steps: businesses },
        ].map((col) => (
          <div key={col.title} className="rounded-2xl border border-border bg-card p-8">
            <h3 className="font-display text-2xl">{col.title}</h3>
            <ol className="mt-6 space-y-6">
              {col.steps.map(([label, desc], i) => (
                <li key={label} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-muted-foreground">{desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
};

const FeaturedListings = () => {
  const { data, isLoading } = useListings({ limit: 3, sort: "highest_bridge_rating" });

  if (isLoading) {
    return (
      <section className="border-t border-border bg-secondary/40 py-24 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  const featured = data?.data || [];

  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-4xl md:text-5xl">Open right now</h2>
          <Link to={PAGES.DASHBOARD_INVESTOR} className="text-sm text-primary hover:underline">
            See all listings →
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featured.map((l: any) => (
            <Link
              key={l.id}
              to={PAGES.LISTINGS_ID}
              params={{ id: l.id }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                  {l.business_profiles?.sector || "Sector"}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  Tier {l.business_profiles?.tier || "1"}
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl">
                {l.business_profiles?.businessName || "Business"}
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">
                Standing ·{" "}
                <span className="font-medium text-foreground">
                  {l.bridge_ratings?.standing || "Seed"}
                </span>
              </div>
              <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Target return</div>
                  <div className="font-display text-2xl">{l.totalReturnPercent}%</div>
                </div>
                <div className="text-sm text-primary group-hover:underline">View →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bridge — Capital that meets businesses where they are" },
      {
        name: "description",
        content:
          "Bridge connects everyday Nigerian investors with vetted small businesses through transparent revenue-share deals.",
      },
      { property: "og:title", content: "Bridge" },
      {
        property: "og:description",
        content: "Capital that meets businesses where they are.",
      },
    ],
  }),
  component: Index,
});
