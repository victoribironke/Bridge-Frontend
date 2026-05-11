/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  useBusinessProfile,
  useBusinessStats,
  useBusinessActiveListing,
  useBusinessActivity,
} from "@/hooks/queries";
import { formatNaira } from "@/lib/utils";
import { PAGES } from "@/lib/constants";
import { useRepayMutation } from "@/hooks/mutations";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const BusinessDashboard = () => {
  const { data: profileData, isLoading: isProfileLoading } = useBusinessProfile();
  const { data: stats, isLoading: isStatsLoading } = useBusinessStats();
  const { data: activeListing, isLoading: isListingLoading } = useBusinessActiveListing();
  const { data: activity, isLoading: isActivityLoading } = useBusinessActivity();
  const repayMut = useRepayMutation();

  if (isProfileLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRepay = (listingId: string) => {
    repayMut.mutate(listingId, {
      onSuccess: () => {
        toast.success("Listing fully repaid!");
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to repay listing.");
      },
    });
  };

  const businessProfile = (profileData as any)?.business_profiles || {};
  const rating = (profileData as any)?.bridge_ratings || { overallStanding: "Seed", score: 0 };

  // Calculate rating percentage assuming max score is 1000
  const ratingPct = Math.min(100, Math.max(0, (rating.score / 1000) * 100));

  const fundedPct = activeListing
    ? Math.min(
        100,
        Math.round((activeListing.totalCommitted / activeListing.capitalRequested) * 100),
      )
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">{businessProfile.businessName || "Your Business"}</h1>
        <Link
          to={PAGES.DASHBOARD_BUSINESS_PAYMENTS}
          className="text-sm text-primary hover:underline"
        >
          Payment link →
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Bridge Rating
          </div>
          <div className="mt-1 font-display text-4xl">{rating.overallStanding}</div>
          <div className="mt-1 text-sm text-muted-foreground">Score {rating.score}</div>
          <div className="mt-4 h-2 rounded-full bg-secondary">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${ratingPct}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {rating.score < 500
              ? "Increase your revenue to improve your score."
              : "Keep up the good work to reach the next standing."}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Tier</div>
          <div className="mt-1 inline-flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary font-display text-lg">
              Tier {businessProfile.tier || 1}
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {businessProfile.tier === 1
              ? "Complete 1 successful repayment to unlock Tier 2."
              : "You're on track."}
          </p>
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
          <div className="mt-4">
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
            {activeListing.status === "funded" && (
              <div className="mt-5 border-t border-border pt-4 text-right">
                <button
                  disabled={repayMut.isPending}
                  onClick={() => handleRepay(activeListing.id)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {repayMut.isPending ? (
                    <Loader2 className="animate-spin inline h-4 w-4" />
                  ) : (
                    "Repay in Full"
                  )}
                </button>
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
            <Stat label="Total raised" value={formatNaira(stats?.totalRaisedKobo || 0)} />
            <Stat label="Total swept" value={formatNaira(stats?.totalSweptKobo || 0)} />
            <Stat label="Completed deals" value={String(stats?.completedDealsCount || 0)} />
          </>
        )}
      </section>

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
                <span className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
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
