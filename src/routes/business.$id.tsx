/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useBusinessProfileById } from "@/hooks/queries";
import { formatNairaFull } from "@/lib/utils";
import { PAGES } from "@/lib/constants";
import { Loader2, MapPin, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";

const BusinessProfilePage = () => {
  const { id } = Route.useParams();
  const { data: profileData, isLoading } = useBusinessProfileById(id);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const business = (profileData as any)?.business_profiles;
  const rating = (profileData as any)?.bridge_ratings;

  if (!business) {
    return (
      <div className="p-16 text-center">
        <h2 className="font-display text-2xl">Business Profile Not Found</h2>
        <p className="mt-2 text-muted-foreground">The requested business could not be loaded.</p>
        <Link
          to={PAGES.DASHBOARD_INVESTOR}
          className="mt-4 inline-block text-primary hover:underline"
        >
          ← Back to Browse
        </Link>
      </div>
    );
  }

  const standing = rating?.overallStanding || "Seed";
  const score = rating?.score || "N/A";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to={PAGES.DASHBOARD_INVESTOR}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Browse
      </Link>

      <header className="mt-6 rounded-3xl border border-border bg-card p-8 md:p-10 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-border px-3 py-1 text-muted-foreground font-medium">
            {business.sector || "Sector"}
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-primary font-medium">
            Tier {business.tier || 1}
          </span>
        </div>

        <h1 className="mt-4 font-display text-4xl md:text-5xl text-foreground">
          {business.businessName}
        </h1>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {business.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{business.location}</span>
            </div>
          )}
          {business.yearsInOperation && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{business.yearsInOperation} years in operation</span>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bridge Rating
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl text-primary">{standing}</span>
              {/* <span className="text-sm font-medium text-muted-foreground">Score: {score}</span> */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${business.cacVerified ? "border-success/30 bg-success/10 text-success" : "border-border bg-secondary text-muted-foreground"}`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>CAC {business.cacVerified ? "Verified" : "Unverified"}</span>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${business.bankConnected ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}
            >
              {business.bankConnected ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>Bank Data {business.monoAverageMonthlyInflow ? "Verified" : "Linked"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 space-y-8">
        <section className="rounded-2xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl">Overview</h2>
          <p className="mt-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {business.businessDescription || "No description provided by the operator."}
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-8">
          <h2 className="font-display text-2xl">Revenue Context</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-secondary/50 border border-border">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Self-Reported Monthly Revenue
              </div>
              <div className="mt-2 font-display text-2xl">
                {formatNairaFull(business.averageMonthlyRevenue || 0)}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="text-xs uppercase tracking-wider text-primary">Monthly Inflow</div>
              <div className="mt-2 font-display text-2xl text-primary">
                {business.monoAverageMonthlyInflow
                  ? formatNairaFull(business.monoAverageMonthlyInflow)
                  : "Pending/Unavailable"}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Read directly from connected bank statements.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/business/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Business Profile — Bridge` },
      { name: "description", content: `Bridge Verified Profile for ${params.id}` },
    ],
  }),
  component: BusinessProfilePage,
});
