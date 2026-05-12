/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Field,
  FormShell,
  GhostBtn,
  Input,
  PrimaryBtn,
  Select,
  Stepper,
  Textarea,
} from "@/components/form-bits";
import { useBusinessProfile, usePreviewTerms, useUserId } from "@/hooks/queries";
import { useCreateListingMutation } from "@/hooks/mutations";
import { BUSINESS_DASHBOARD_SNAPSHOT_KEY, PAGES } from "@/lib/constants";
import { formatNaira, formatNairaFull } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Raise", "Terms"];

const TIER_LIMIT: Record<number, number> = {
  1: 10_000_000,
  2: 50_000_000,
  3: 100_000_000,
};

const getStoredDashboardSnapshot = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BUSINESS_DASHBOARD_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const cleanBackendMessage = (message?: string) => {
  return (message || "We could not calculate deal terms for this capital amount and timeline.")
    .replace(/â‚¦/g, "₦")
    .replace(/\r\n/g, "\n");
};

const CreateListing = () => {
  const navigate = useNavigate();
  const userId = useUserId();
  const [storedSnapshot] = useState<any>(() => getStoredDashboardSnapshot());

  const storedProfileData = storedSnapshot?.profileData;
  const storedProfileUserId = storedProfileData?.business_profiles?.userId;
  const snapshotMatchesUser = !!storedProfileData && (!userId || storedProfileUserId === userId);
  const { data: fetchedProfileData, isLoading: isProfileLoading } =
    useBusinessProfile(!snapshotMatchesUser);
  const profileData = snapshotMatchesUser ? storedProfileData : fetchedProfileData;

  const [step, setStep] = useState(0);
  const [capital, setCapital] = useState<number>(100_000);
  const [preferredRepaymentMonths, setPreferredRepaymentMonths] = useState(12);
  const [useFunds, setUseFunds] = useState("");
  const [impact, setImpact] = useState("");
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);

  const createMut = useCreateListingMutation();

  const businessProfile = (profileData as any)?.business_profiles || {};
  const tier = businessProfile.tier || 1;
  const repaymentOptions = useMemo(
    () => (tier === 1 ? [12, 15, 18] : [12, 15, 18, 21, 24]),
    [tier],
  );
  const tierCapKobo = TIER_LIMIT[tier] || TIER_LIMIT[1];
  const verifiedMonthlyRevenueKobo = Number(businessProfile.monoAverageMonthlyInflow || 0);
  const revenueMultipleCapKobo = Math.floor(verifiedMonthlyRevenueKobo * 1.5);
  const limitKobo = Math.min(tierCapKobo, revenueMultipleCapKobo || tierCapKobo);
  const limitNaira = Math.floor(limitKobo / 100);
  const requestedCapitalKobo = capital * 100;
  const capitalValid = capital > 0 && requestedCapitalKobo <= limitKobo;
  const canCalculateTerms =
    step === 1 && capitalValid && repaymentOptions.includes(preferredRepaymentMonths);

  const {
    data: termsData,
    isLoading: isTermsLoading,
    isFetching: isTermsFetching,
    isError: isTermsError,
    error: termsError,
  } = usePreviewTerms(requestedCapitalKobo, preferredRepaymentMonths, canCalculateTerms);
  const terms = termsData || {};
  const termsErrorMessage = cleanBackendMessage(termsError?.message);
  const shouldOffer18Months =
    isTermsError &&
    repaymentOptions.includes(18) &&
    preferredRepaymentMonths !== 18 &&
    termsErrorMessage.includes("18 months");

  useEffect(() => {
    if (limitNaira > 0 && capital > limitNaira) {
      setCapital(limitNaira);
    }
  }, [capital, limitNaira]);

  useEffect(() => {
    if (!repaymentOptions.includes(preferredRepaymentMonths)) {
      setPreferredRepaymentMonths(repaymentOptions[repaymentOptions.length - 1]);
    }
  }, [preferredRepaymentMonths, repaymentOptions]);

  if (!profileData && isProfileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          Loading listing requirements...
        </div>
      </div>
    );
  }

  if (profileData && businessProfile.monoAverageMonthlyInflow == null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-6">
          <h2 className="flex items-center gap-2 font-display text-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-warning" />
            Analyzing bank data
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We are currently processing your connected bank inflows to generate your tailored deal
            terms. This usually takes under a minute. Please check back soon.
          </p>
          <button
            onClick={() => navigate({ to: PAGES.DASHBOARD_BUSINESS })}
            className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-success/30 bg-success/10 p-10">
          <h2 className="font-display text-3xl">Your listing is live</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your AI investor profile has been generated and your listing is now available to
            investors.
          </p>
          <Link
            to={PAGES.LISTINGS_ID}
            params={{ id: submitted.id }}
            className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View live listing
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    createMut.mutate(
      {
        capitalRequested: requestedCapitalKobo,
        preferredRepaymentMonths,
        useOfFunds: useFunds,
        expectedImpact: impact,
      },
      {
        onSuccess: (data) => {
          toast.success("Listing created successfully!");
          setSubmitted({ id: data.id });
        },
        onError: (err: any) => {
          if (err.statusCode === 409) {
            toast.error("You already have an active listing.");
            navigate({ to: PAGES.DASHBOARD_BUSINESS });
            return;
          }

          toast.error(cleanBackendMessage(err.message) || "Failed to create listing.");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl">Create a listing</h1>
      <Stepper steps={STEPS} current={step} />

      <div className="mt-8">
        {step === 0 && (
          <FormShell
            title="Raise details"
            subtitle={`You can raise up to ${formatNairaFull(limitKobo)} based on your verified monthly inflow and tier cap.`}
            footer={
              <>
                <span />
                <PrimaryBtn
                  disabled={!capitalValid || useFunds.length < 80 || impact.length < 80}
                  onClick={() => setStep(1)}
                >
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field
              label="Capital amount (₦)"
              hint={`Maximum ${formatNairaFull(limitKobo)}. This is capped at 1.5× your Mono-verified monthly inflow and your tier limit.`}
            >
              <Input
                type="number"
                min={1}
                max={limitNaira}
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Preferred repayment period">
              <Select
                value={preferredRepaymentMonths}
                onChange={(e) => setPreferredRepaymentMonths(Number(e.target.value))}
              >
                {repaymentOptions.map((months) => (
                  <option key={months} value={months}>
                    {months} months
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Use of funds" hint={`${useFunds.length}/80 minimum — be specific.`}>
              <Textarea
                rows={4}
                value={useFunds}
                onChange={(e) => setUseFunds(e.target.value)}
                placeholder="What exactly will this capital be used for?"
              />
            </Field>
            <Field label="Expected impact" hint={`${impact.length}/80 minimum`}>
              <Textarea
                rows={4}
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="What will this capital allow you to do that you cannot do today?"
              />
            </Field>
          </FormShell>
        )}

        {step === 1 && (
          <FormShell
            title="Deal terms"
            subtitle="Calculated from your capital ask, selected repayment period, and linked bank inflows."
            footer={
              <>
                <GhostBtn onClick={() => setStep(0)} disabled={createMut.isPending}>
                  Back
                </GhostBtn>
                <PrimaryBtn
                  disabled={
                    isTermsLoading ||
                    isTermsFetching ||
                    isTermsError ||
                    !termsData ||
                    createMut.isPending
                  }
                  onClick={handleSubmit}
                >
                  {createMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit listing"
                  )}
                </PrimaryBtn>
              </>
            }
          >
            {isTermsLoading || isTermsFetching ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Calculating deal terms...
              </div>
            ) : isTermsError ? (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-5 text-sm">
                <div className="font-medium text-warning">These terms need adjustment</div>
                <p className="mt-3 whitespace-pre-line text-muted-foreground">
                  {termsErrorMessage}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setStep(0)}
                    className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary"
                  >
                    Adjust amount
                  </button>
                  {shouldOffer18Months && (
                    <button
                      onClick={() => setPreferredRepaymentMonths(18)}
                      className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Use 18 months
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <Term label="Revenue share" value={`${terms.revenueSharePercent || 0}%`} />
                  <Term
                    label="Total return"
                    value={`${formatNairaFull(terms.totalReturnAmount || 0)} (${terms.totalReturnPercent || 0}%)`}
                  />
                  <Term
                    label="Target horizon"
                    value={`${terms.targetRepaymentMonths || preferredRepaymentMonths} months`}
                  />
                  <Term
                    label="Monthly sweep at avg revenue"
                    value={formatNaira(terms.monthlySweepAtAverage || 0)}
                  />
                </dl>
                <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                  Revenue share is calculated from your average monthly inflow and the size of the
                  raise, capped so monthly sweeps stay within a comfortable share of your typical
                  sales.
                </p>
                <div className="mt-4">
                  <div className="text-sm font-medium">Tranche breakdown</div>
                  <ul className="mt-2 space-y-2">
                    <li className="flex justify-between rounded-lg border border-border p-3 text-sm">
                      <div>
                        <div className="font-medium">Tranche 1</div>
                        <div className="text-xs text-muted-foreground">
                          Released at full funding
                        </div>
                      </div>
                      <span className="font-medium">{formatNaira(terms.tranche1 || 0)}</span>
                    </li>
                    <li className="flex justify-between rounded-lg border border-border p-3 text-sm">
                      <div>
                        <div className="font-medium">Tranche 2</div>
                        <div className="text-xs text-muted-foreground">
                          Released at 33% repayment
                        </div>
                      </div>
                      <span className="font-medium">{formatNaira(terms.tranche2 || 0)}</span>
                    </li>
                    <li className="flex justify-between rounded-lg border border-border p-3 text-sm">
                      <div>
                        <div className="font-medium">Tranche 3</div>
                        <div className="text-xs text-muted-foreground">
                          Released at 67% repayment
                        </div>
                      </div>
                      <span className="font-medium">{formatNaira(terms.tranche3 || 0)}</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </FormShell>
        )}
      </div>
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

export const Route = createFileRoute("/dashboard/business/create-listing")({
  head: () => ({ meta: [{ title: "Create a listing — Bridge" }] }),
  component: CreateListing,
});
