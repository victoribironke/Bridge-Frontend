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
} from "@/components/form-bits";
import { mockBvnVerify, mockSquadAccount, SECTORS } from "@/lib/mock-data";
import { useMockAuth } from "@/lib/mock-auth";

export const Route = createFileRoute("/register/investor")({
  head: () => ({ meta: [{ title: "Register as an investor — Bridge" }] }),
  component: InvestorRegister,
});

const STEPS = ["Personal", "BVN", "Preferences", "Done"];

const RISK = [
  {
    id: "conservative",
    label: "Conservative",
    desc: "Tier 1 only. Steady, lower-return deals.",
  },
  {
    id: "balanced",
    label: "Balanced",
    desc: "Tier 1 + Tier 2. Mix of stability and growth.",
  },
  {
    id: "growth",
    label: "Growth",
    desc: "All tiers. Higher targets, higher variance.",
  },
];

const TIMELINES = [
  { id: "short", label: "Short", desc: "Under 6 months" },
  { id: "medium", label: "Medium", desc: "6 to 12 months" },
  { id: "flex", label: "Flexible", desc: "Any timeline" },
];

function InvestorRegister() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { setRole } = useMockAuth();

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

  const [sectors, setSectors] = useState<string[]>([]);
  const [risk, setRisk] = useState<string>("");
  const [timeline, setTimeline] = useState<string>("");
  const [range, setRange] = useState<string>("");

  const phoneOk = /^(?:\+234|0)[789]\d{9}$/.test(personal.phone);
  const passwordOk = personal.password.length >= 8;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl">Set up your investor account</h1>
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
                <span className="text-sm text-destructive">Could not verify. Try again.</span>
              )}
            </div>
          </FormShell>
        )}

        {step === 2 && (
          <FormShell
            title="Investment preferences"
            subtitle="Optional. We use these to surface listings on the For You tab."
            footer={
              <>
                <GhostBtn onClick={() => setStep(1)}>Back</GhostBtn>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Skip and set later
                  </button>
                  <PrimaryBtn onClick={() => setStep(3)}>Continue</PrimaryBtn>
                </div>
              </>
            }
          >
            <div>
              <div className="text-sm font-medium">Sector interests</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {SECTORS.map((s) => {
                  const on = sectors.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() =>
                        setSectors(on ? sectors.filter((x) => x !== s) : [...sectors, s])
                      }
                      className={
                        "rounded-full border px-3 py-1 text-xs " +
                        (on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50")
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Risk tier preference</div>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {RISK.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRisk(r.id)}
                    className={
                      "rounded-xl border p-4 text-left " +
                      (risk === r.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40")
                    }
                  >
                    <div className="font-medium">{r.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">Return timeline</div>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {TIMELINES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTimeline(t.id)}
                    className={
                      "rounded-xl border p-4 text-left " +
                      (timeline === t.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40")
                    }
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <Field label="Investment range per deal">
              <Select value={range} onChange={(e) => setRange(e.target.value)}>
                <option value="">Pick a range</option>
                <option>₦25,000 – ₦100,000</option>
                <option>₦100,000 – ₦500,000</option>
                <option>₦500,000 – ₦2,000,000</option>
                <option>₦2,000,000+</option>
              </Select>
            </Field>
          </FormShell>
        )}

        {step === 3 && (
          <FormShell title="Your account is ready">
            <div className="rounded-xl border border-border bg-secondary/40 p-5 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Squad virtual account
              </div>
              <div className="mt-1 font-display text-2xl">{mockSquadAccount()}</div>
              <p className="mt-2 text-muted-foreground">
                Invested capital and returns flow through this account.
              </p>
            </div>
            <PrimaryBtn
              className="w-full"
              onClick={() => {
                setRole("investor");
                navigate({ to: "/dashboard/investor" });
              }}
            >
              Go to dashboard
            </PrimaryBtn>
          </FormShell>
        )}
      </div>
    </div>
  );
}
