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
import { SECTORS, PAGES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { useRegisterInvestorMutation, useUpdatePreferencesMutation } from "@/hooks/mutations";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Personal", "BVN", "Preferences", "Done"];

const RISK = [
  {
    id: "conservative",
    label: "Conservative",
    desc: "Prioritize lower risk and consistent returns. Mostly established businesses and anchor ratings.",
  },
  {
    id: "balanced",
    label: "Balanced",
    desc: "Mix of growth and established businesses. Target 18-24% annual returns.",
  },
  {
    id: "growth",
    label: "Growth",
    desc: "Higher risk tolerance for maximum returns. Open to early-stage (Seed) businesses.",
  },
];

const RegisterInvestor = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { virtualAccountNumber } = useAuth();
  const registerMut = useRegisterInvestorMutation();
  const prefsMut = useUpdatePreferencesMutation();

  const [personal, setPersonal] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    beneficiaryAccount: "",
  });

  const [bvn, setBvn] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [sectors, setSectors] = useState<string[]>([]);
  const [risk, setRisk] = useState("balanced");
  const [amount, setAmount] = useState({ min: "50000", max: "2000000" });

  const handleRegister = () => {
    registerMut.mutate(
      {
        fullName: personal.fullName,
        email: personal.email,
        phone: personal.phone,
        password: personal.password,
        beneficiaryAccount: personal.beneficiaryAccount,
        bvn,
      },
      {
        onSuccess: (data) => {
          setUserId(data.user?.id || null); // Note: Assuming the API returns the user object or we can decode it, but we can set preferences later or skip.
          setStep(2);
        },
        onError: (err) => {
          toast.error(err.message || "Registration failed. BVN or email might be invalid.");
        },
      },
    );
  };

  const handlePreferences = () => {
    if (!userId) {
      setStep(3);
      return;
    }
    prefsMut.mutate(
      {
        userId,
        data: {
          sectorInterests: sectors,
          riskTierPreference: risk,
          investmentRangeMin: Number(amount.min) * 100,
          investmentRangeMax: Number(amount.max) * 100,
        },
      },
      {
        onSettled: () => setStep(3),
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl">Investor sign up</h1>
      <Stepper steps={STEPS} current={step} />

      <div className="mt-8">
        {step === 0 && (
          <FormShell
            title="Personal details"
            subtitle="Let's get your account set up."
            footer={
              <>
                <span />
                <PrimaryBtn
                  disabled={
                    !personal.fullName ||
                    !personal.email ||
                    personal.password.length < 8 ||
                    personal.beneficiaryAccount.length !== 10
                  }
                  onClick={() => setStep(1)}
                >
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            <Field label="Full name" hint="As it appears on your BVN">
              <Input
                value={personal.fullName}
                onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
              />
            </Field>
            <Field label="Email address">
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
            <Field
              label="Payout Bank Account"
              hint="10-digit Nigerian bank account for withdrawing returns"
            >
              <Input
                value={personal.beneficiaryAccount}
                onChange={(e) => setPersonal({ ...personal, beneficiaryAccount: e.target.value })}
                maxLength={10}
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
                <GhostBtn onClick={() => setStep(0)} disabled={registerMut.isPending}>
                  Back
                </GhostBtn>
                <PrimaryBtn
                  disabled={bvn.length !== 11 || registerMut.isPending}
                  onClick={handleRegister}
                >
                  {registerMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify and Register"
                  )}
                </PrimaryBtn>
              </>
            }
          >
            <Field label="BVN">
              <Input value={bvn} onChange={(e) => setBvn(e.target.value)} maxLength={11} />
            </Field>
          </FormShell>
        )}

        {step === 2 && (
          <FormShell
            title="Investment preferences"
            subtitle="Optional. We use these to surface listings on the For You tab."
            footer={
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  disabled={prefsMut.isPending}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  Skip and set later
                </button>
                <PrimaryBtn onClick={handlePreferences} disabled={prefsMut.isPending}>
                  {prefsMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                </PrimaryBtn>
              </div>
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
              <div className="text-sm font-medium">Risk profile</div>
              <div className="mt-2 space-y-2">
                {RISK.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRisk(r.id)}
                    className={
                      "block w-full rounded-xl border p-4 text-left transition-colors " +
                      (risk === r.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-secondary/40")
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                          (risk === r.id ? "border-primary" : "border-muted-foreground")
                        }
                      >
                        {risk === r.id && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <span className="font-medium">{r.label}</span>
                    </div>
                    <p className="mt-1 pl-6 text-sm text-muted-foreground">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Min investment (₦)" hint="Optional">
                <Input
                  type="number"
                  value={amount.min}
                  onChange={(e) => setAmount({ ...amount, min: e.target.value })}
                />
              </Field>
              <Field label="Max investment (₦)" hint="Optional">
                <Input
                  type="number"
                  value={amount.max}
                  onChange={(e) => setAmount({ ...amount, max: e.target.value })}
                />
              </Field>
            </div>
          </FormShell>
        )}

        {step === 3 && (
          <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
            <h2 className="font-display text-3xl">You're all set!</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Your account has been created and your BVN verified. We've generated your unique Squad
              virtual account for funding your wallet.
            </p>
            <div className="mt-6 inline-block rounded-xl border border-border bg-card px-6 py-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Squad Wallet Account
              </div>
              <div className="mt-1 font-display text-2xl tracking-widest text-primary">
                {virtualAccountNumber || "Pending..."}
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={() => navigate({ to: PAGES.DASHBOARD_INVESTOR })}
                className="rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createFileRoute("/register/investor")({
  head: () => ({ meta: [{ title: "Investor Sign Up — Bridge" }] }),
  component: RegisterInvestor,
});
