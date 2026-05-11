import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Field,
  FormShell,
  GhostBtn,
  Input,
  PrimaryBtn,
  Stepper,
  Textarea,
} from "@/components/form-bits";
import { useBusinessActiveListing, useBusinessProfile, usePreviewTerms } from "@/hooks/queries";
import { useCreateListingMutation } from "@/hooks/mutations";
import { PAGES } from "@/lib/constants";
import { formatNaira, formatNairaFull } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Raise", "Terms", "References"];

const TIER_LIMIT: Record<number, number> = {
  1: 10_000_000,
  2: 50_000_000,
  3: 100_000_000,
};

const CreateListing = () => {
  const navigate = useNavigate();
  const { data: activeListing, isLoading: isActiveLoading } = useBusinessActiveListing();
  const { data: profileData } = useBusinessProfile();

  const [step, setStep] = useState(0);
  const [capital, setCapital] = useState<number>(2_000_000);
  const [useFunds, setUseFunds] = useState("");
  const [impact, setImpact] = useState("");
  const [refs, setRefs] = useState<[string, string, string]>(["", "", ""]);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);

  const createMut = useCreateListingMutation();

  const businessProfile = profileData?.business_profiles || {};
  const tier = businessProfile.tier || 1;
  const limitKobo = TIER_LIMIT[tier] || 10_000_000;
  const limitNaira = limitKobo / 100;

  const { data: termsData, isLoading: isTermsLoading } = usePreviewTerms(capital * 100);
  const terms = termsData || {};

  if (isActiveLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activeListing) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-6">
          <h2 className="font-display text-2xl">You already have an active listing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Wait until it's fully funded and completed before creating a new one.
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
            SMS confirmations have been sent to your customer references and your AI profile is
            generated.
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
        capitalRequested: capital * 100,
        preferredRepaymentMonths: 12, // Default to 12 or use terms.targetRepaymentMonths if available
        useOfFunds: useFunds,
        expectedImpact: impact,
      },
      {
        onSuccess: (data) => {
          toast.success("Listing created successfully!");
          setSubmitted({ id: data.id });
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create listing.");
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
            subtitle={`Your current tier raise limit is ${formatNairaFull(limitKobo)}.`}
            footer={
              <>
                <span />
                <PrimaryBtn
                  disabled={
                    !capital || capital > limitNaira || useFunds.length < 80 || impact.length < 80
                  }
                  onClick={() => setStep(1)}
                >
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field label="Capital amount (₦)" hint={`Maximum ${formatNairaFull(limitKobo)}`}>
              <Input
                type="number"
                min={100_000}
                max={limitNaira}
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value) || 0)}
              />
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
            subtitle="Calculated from your capital ask and your linked bank inflows. To change them, go back and adjust the capital amount."
            footer={
              <>
                <GhostBtn onClick={() => setStep(0)}>Back</GhostBtn>
                <PrimaryBtn disabled={isTermsLoading} onClick={() => setStep(2)}>
                  Accept these terms
                </PrimaryBtn>
              </>
            }
          >
            {isTermsLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-primary" />
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
                    value={`${terms.targetRepaymentMonths || 12} months`}
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

        {step === 2 && (
          <FormShell
            title="Customer references"
            subtitle="Each number gets an SMS asking them to confirm they purchased from you. Confirmations appear on the listing and improve your Bridge Rating."
            footer={
              <>
                <GhostBtn onClick={() => setStep(1)} disabled={createMut.isPending}>
                  Back
                </GhostBtn>
                <PrimaryBtn disabled={!refs[0] || createMut.isPending} onClick={handleSubmit}>
                  {createMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit listing"
                  )}
                </PrimaryBtn>
              </>
            }
          >
            <Field label="Reference 1 (required)">
              <Input
                value={refs[0]}
                onChange={(e) => setRefs([e.target.value, refs[1], refs[2]])}
              />
            </Field>
            <Field label="Reference 2">
              <Input
                value={refs[1]}
                onChange={(e) => setRefs([refs[0], e.target.value, refs[2]])}
              />
            </Field>
            <Field label="Reference 3">
              <Input
                value={refs[2]}
                onChange={(e) => setRefs([refs[0], refs[1], e.target.value])}
              />
            </Field>
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
