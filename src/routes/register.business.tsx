import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import {
  mockBankConnect,
  mockBvnVerify,
  mockSquadAccount,
  SECTORS,
  formatNairaFull,
} from "@/lib/mock-data";
import { useMockAuth } from "@/lib/mock-auth";

const STEPS = ["Personal", "BVN", "Business", "Bank", "Done"];

const BusinessRegister = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { setRole } = useMockAuth();

  // form state
  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [bvn, setBvn] = useState("");
  const [bvnState, setBvnState] = useState<{
    status: "idle" | "loading" | "ok" | "err";
    name?: string;
  }>({ status: "idle" });
  const [biz, setBiz] = useState({
    name: "",
    sector: "",
    location: "",
    years: "",
    revenue: "",
    description: "",
  });
  const [bankState, setBankState] = useState<{
    status: "idle" | "loading" | "ok";
    data?: Awaited<ReturnType<typeof mockBankConnect>>;
  }>({ status: "idle" });

  const phoneOk = /^(?:\+234|0)[789]\d{9}$/.test(personal.phone);
  const passwordOk = personal.password.length >= 8;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Set up your business account</h1>
      </div>
      <Stepper steps={STEPS} current={step} />
      <div className="mt-8">
        {step === 0 && (
          <FormShell
            title="Personal information"
            footer={
              <>
                <span />
                <PrimaryBtn
                  disabled={!personal.name || !personal.email || !phoneOk || !passwordOk}
                  onClick={() => setStep(1)}
                >
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field label="Full name">
              <Input
                value={personal.name}
                onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={personal.email}
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              />
            </Field>
            <Field label="Phone number" hint="Nigerian mobile, e.g. 0803XXXXXXX">
              <Input
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
              />
            </Field>
            <Field label="Password" hint="Minimum 8 characters">
              <Input
                type="password"
                value={personal.password}
                onChange={(e) => setPersonal({ ...personal, password: e.target.value })}
              />
            </Field>
          </FormShell>
        )}

        {step === 1 && (
          <FormShell
            title="Verify your BVN"
            subtitle="Your BVN is used to confirm your identity. We never share it."
            footer={
              <>
                <GhostBtn onClick={() => setStep(0)}>Back</GhostBtn>
                <PrimaryBtn disabled={bvnState.status !== "ok"} onClick={() => setStep(2)}>
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field label="BVN">
              <Input value={bvn} onChange={(e) => setBvn(e.target.value)} maxLength={11} />
            </Field>
            <div className="flex items-center gap-3">
              <PrimaryBtn
                disabled={bvn.length !== 11 || bvnState.status === "loading"}
                onClick={async () => {
                  setBvnState({ status: "loading" });
                  try {
                    const r = await mockBvnVerify();
                    setBvnState({ status: "ok", name: r.name });
                  } catch {
                    setBvnState({ status: "err" });
                  }
                }}
              >
                {bvnState.status === "loading" ? "Verifying…" : "Verify BVN"}
              </PrimaryBtn>
              {bvnState.status === "ok" && (
                <span className="text-sm text-success">✓ Verified as {bvnState.name}</span>
              )}
              {bvnState.status === "err" && (
                <span className="text-sm text-destructive">
                  Could not verify. Check the number and try again.
                </span>
              )}
            </div>
          </FormShell>
        )}

        {step === 2 && (
          <FormShell
            title="Business information"
            footer={
              <>
                <GhostBtn onClick={() => setStep(1)}>Back</GhostBtn>
                <PrimaryBtn
                  disabled={
                    !biz.name ||
                    !biz.sector ||
                    !biz.location ||
                    !biz.revenue ||
                    biz.description.length < 80
                  }
                  onClick={() => setStep(3)}
                >
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field label="Business name">
              <Input value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} />
            </Field>
            <Field label="Business type">
              <Select
                value={biz.sector}
                onChange={(e) => setBiz({ ...biz, sector: e.target.value })}
              >
                <option value="">Select a sector</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Business location">
              <Input
                value={biz.location}
                onChange={(e) => setBiz({ ...biz, location: e.target.value })}
              />
            </Field>
            <Field label="Years in operation">
              <Input
                type="number"
                min={0}
                value={biz.years}
                onChange={(e) => setBiz({ ...biz, years: e.target.value })}
              />
            </Field>
            <Field
              label="Average monthly revenue (₦)"
              hint="This figure will be compared to the linked bank account in the next step. Significant discrepancies appear on your profile."
            >
              <Input
                type="number"
                min={0}
                value={biz.revenue}
                onChange={(e) => setBiz({ ...biz, revenue: e.target.value })}
              />
            </Field>
            <Field label="Short description" hint={`${biz.description.length}/80 minimum`}>
              <Textarea
                rows={4}
                value={biz.description}
                onChange={(e) => setBiz({ ...biz, description: e.target.value })}
              />
            </Field>
          </FormShell>
        )}

        {step === 3 && (
          <FormShell
            title="Connect your bank account"
            subtitle="We read 12+ months of inflows so investors see a real picture of your business."
            footer={
              <>
                <GhostBtn onClick={() => setStep(2)}>Back</GhostBtn>
                <PrimaryBtn disabled={bankState.status !== "ok"} onClick={() => setStep(4)}>
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            {bankState.status !== "ok" && (
              <div className="rounded-xl border border-dashed border-border p-6">
                <div className="text-sm font-medium">Choose a provider</div>
                <div className="mt-3 flex gap-3">
                  {["Mono", "Okra"].map((p) => (
                    <button
                      key={p}
                      disabled={bankState.status === "loading"}
                      onClick={async () => {
                        setBankState({ status: "loading" });
                        const data = await mockBankConnect();
                        setBankState({ status: "ok", data });
                      }}
                      className="flex-1 rounded-md border border-input px-4 py-3 text-sm font-medium hover:bg-secondary disabled:opacity-50"
                    >
                      {bankState.status === "loading" ? "Connecting…" : `Connect with ${p}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {bankState.status === "ok" && bankState.data && (
              <div className="rounded-xl border border-success/40 bg-success/10 p-5 text-sm">
                <div className="font-medium text-success">Bank account linked</div>
                <ul className="mt-3 space-y-1">
                  <li>
                    Account name: <span className="font-medium">{bankState.data.accountName}</span>
                  </li>
                  <li>
                    Transaction history: <span className="font-medium">{bankState.data.range}</span>
                  </li>
                  <li>
                    Average monthly inflow:{" "}
                    <span className="font-medium">
                      {formatNairaFull(bankState.data.averageInflow)}
                    </span>
                  </li>
                </ul>
                {Number(biz.revenue) > 0 &&
                  bankState.data.averageInflow < Number(biz.revenue) * 0.8 && (
                    <p className="mt-3 text-xs text-warning">
                      Note: average inflow is below the revenue you stated. This will be visible on
                      your profile.
                    </p>
                  )}
              </div>
            )}
          </FormShell>
        )}

        {step === 4 && (
          <FormShell title="Your account is ready">
            <div className="rounded-xl border border-border bg-secondary/40 p-5 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Squad virtual account
              </div>
              <div className="mt-1 font-display text-2xl">{mockSquadAccount()}</div>
              <p className="mt-2 text-muted-foreground">
                All payments and disbursements flow through this account.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Bridge Rating
              </div>
              <div className="mt-1 font-display text-2xl">Seed</div>
              <p className="mt-2 text-muted-foreground">
                Standing improves as you complete repayments and grow inflows.
              </p>
            </div>
            <PrimaryBtn
              className="w-full"
              onClick={() => {
                setRole("business");
                navigate({ to: "/dashboard/business" });
              }}
            >
              Go to dashboard
            </PrimaryBtn>
          </FormShell>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/register/business")({
  head: () => ({ meta: [{ title: "Register your business — Bridge" }] }),
  component: BusinessRegister,
});
