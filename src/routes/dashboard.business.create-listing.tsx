import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Field,
  FormShell,
  GhostBtn,
  Input,
  PrimaryBtn,
  Stepper,
  Textarea,
} from "@/components/form-bits";
import {
  businessActiveListing,
  businessProfile,
  calculateDealTerms,
  formatNaira,
  formatNairaFull,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/business/create-listing")({
  head: () => ({ meta: [{ title: "Create a listing — Bridge" }] }),
  component: CreateListing,
});

const STEPS = ["Raise", "Terms", "References"];

const TIER_LIMIT: Record<string, number> = {
  "Tier 1": 2_000_000,
  "Tier 2": 5_000_000,
  "Tier 3": 15_000_000,
};

function CreateListing() {
  const navigate = useNavigate();
  const hasActive = !!businessActiveListing;
  const [showRedirect] = useState(hasActive);
  const [step, setStep] = useState(0);
  const [capital, setCapital] = useState<number>(2_000_000);
  const [useFunds, setUseFunds] = useState("");
  const [impact, setImpact] = useState("");
  const [refs, setRefs] = useState<[string, string, string]>(["", "", ""]);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);

  const limit = TIER_LIMIT[businessProfile.tier.current];
  const terms = useMemo(() => calculateDealTerms(capital), [capital]);

  if (showRedirect) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-6">
          <h2 className="font-display text-2xl">You already have an active listing</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Wait until it's fully funded and completed before creating a new one.
          </p>
          <button
            onClick={() => navigate({ to: "/dashboard/business" })}
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
            to="/listings/$id"
            params={{ id: submitted.id }}
            className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View live listing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl">Create a listing</h1>
      <Stepper steps={STEPS} current={step} />

      <div className="mt-8">
        {step === 0 && (
          <FormShell
            title="Raise details"
            subtitle={`Your current tier raise limit is ${formatNairaFull(limit)}.`}
            footer={
              <>
                <span />
                <PrimaryBtn
                  disabled={!capital || useFunds.length < 80 || impact.length < 80}
                  onClick={() => setStep(1)}
                >
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field label="Capital amount (₦)" hint={`Maximum ${formatNairaFull(limit)}`}>
              <Input
                type="number"
                min={100_000}
                max={limit}
                value={capital}
                onChange={(e) => setCapital(Math.min(limit, Number(e.target.value) || 0))}
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
                <PrimaryBtn onClick={() => setStep(2)}>Accept these terms</PrimaryBtn>
              </>
            }
          >
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Term label="Revenue share" value={`${terms.revenueSharePct}%`} />
              <Term
                label="Total return"
                value={`${formatNairaFull(terms.totalReturnNaira)} (${terms.totalReturnPct}%)`}
              />
              <Term label="Target horizon" value={`${terms.targetMonths} months`} />
              <Term
                label="Monthly sweep at average revenue"
                value={formatNaira(terms.monthlySweep)}
              />
            </dl>
            <p className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
              Revenue share is calculated from your average monthly inflow and the size of the
              raise, capped so monthly sweeps stay within a comfortable share of your typical sales.
            </p>
            <div>
              <div className="text-sm font-medium">Tranche breakdown</div>
              <ul className="mt-2 space-y-2">
                {terms.tranches.map((t) => (
                  <li
                    key={t.label}
                    className="flex justify-between rounded-lg border border-border p-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.condition}</div>
                    </div>
                    <span className="font-medium">{formatNaira(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </FormShell>
        )}

        {step === 2 && (
          <FormShell
            title="Customer references"
            subtitle="Each number gets an SMS asking them to confirm they purchased from you. Confirmations appear on the listing and improve your Bridge Rating."
            footer={
              <>
                <GhostBtn onClick={() => setStep(1)}>Back</GhostBtn>
                <PrimaryBtn disabled={!refs[0]} onClick={() => setSubmitted({ id: "lst_new_001" })}>
                  Submit listing
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
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
