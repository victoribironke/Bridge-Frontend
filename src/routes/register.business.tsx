/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { SECTORS, PAGES } from "@/lib/constants";
import { formatNairaFull } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useRegisterBusinessMutation, useConnectBankMutation } from "@/hooks/mutations";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const STEPS = ["Personal", "BVN", "Business", "Bank", "Done"];

const BusinessRegister = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { virtualAccountNumber } = useAuth();

  const registerMut = useRegisterBusinessMutation();
  const connectMut = useConnectBankMutation();

  // form state
  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [bvn, setBvn] = useState("");
  const [biz, setBiz] = useState({
    name: "",
    sector: "",
    location: "",
    years: "",
    revenue: "",
    description: "",
  });

  const [bankData, setBankData] = useState<any>(null);

  const phoneOk = /^(?:\+234|0)[789]\d{9}$/.test(personal.phone);
  const passwordOk = personal.password.length >= 8;

  const handleRegister = () => {
    registerMut.mutate(
      {
        fullName: personal.name,
        email: personal.email,
        phone: personal.phone,
        password: personal.password,
        bvn,
        businessName: biz.name,
        sector: biz.sector,
        location: biz.location,
        yearsInOperation: Number(biz.years),
        averageMonthlyRevenue: Number(biz.revenue) * 100, // kobo
        businessDescription: biz.description,
      },
      {
        onSuccess: () => {
          setStep(3);
        },
        onError: (err) => {
          toast.error(err.message || "Registration failed.");
        },
      },
    );
  };

  const handleConnectBank = async (provider: string) => {
    // In a real app, this would open the Mono or Okra widget.
    // For now, we simulate getting a success code and sending it to the backend.
    const fakeCode = "mono_auth_code_12345";

    connectMut.mutate(fakeCode, {
      onSuccess: () => {
        setBankData({ provider, inflow: Number(biz.revenue) });
      },
      onError: (err) => {
        toast.error(err.message || "Failed to connect bank account.");
      },
    });
  };

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
            subtitle="Fill in your personal details to get started with Bridge."
            footer={
              <PrimaryBtn
                disabled={!personal.name || !personal.email || !phoneOk || !passwordOk}
                onClick={() => setStep(1)}
              >
                Continue
              </PrimaryBtn>
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
                <PrimaryBtn disabled={bvn.length !== 11} onClick={() => setStep(2)}>
                  Continue
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
            title="Business information"
            footer={
              <>
                <GhostBtn onClick={() => setStep(1)} disabled={registerMut.isPending}>
                  Back
                </GhostBtn>
                <PrimaryBtn
                  disabled={
                    !biz.name ||
                    !biz.sector ||
                    !biz.location ||
                    !biz.revenue ||
                    biz.description.length < 80 ||
                    registerMut.isPending
                  }
                  onClick={handleRegister}
                >
                  {registerMut.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify & Create Account"
                  )}
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
                <span />
                <PrimaryBtn disabled={!bankData} onClick={() => setStep(4)}>
                  Continue
                </PrimaryBtn>
              </>
            }
          >
            {!bankData ? (
              <div className="rounded-xl border border-dashed border-border p-6">
                <div className="text-sm font-medium">Choose a provider</div>
                <div className="mt-3 flex gap-3">
                  {["Mono", "Okra"].map((p) => (
                    <button
                      key={p}
                      disabled={connectMut.isPending}
                      onClick={() => handleConnectBank(p)}
                      className="flex-1 rounded-md border border-input px-4 py-3 text-sm font-medium hover:bg-secondary disabled:opacity-50 flex justify-center items-center"
                    >
                      {connectMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-success/40 bg-success/10 p-5 text-sm">
                <div className="font-medium text-success">✓ Bank connected</div>
                <div className="mt-2 text-muted-foreground">
                  Linked via {bankData.provider}. Analyzed average monthly inflow:{" "}
                  <span className="font-medium text-foreground">
                    {formatNairaFull(bankData.inflow * 100)}
                  </span>
                </div>
              </div>
            )}
          </FormShell>
        )}

        {step === 4 && (
          <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
            <h2 className="font-display text-3xl">Registration complete</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              Your business is set up and your bank is connected. To start raising capital, you can
              create your first listing from the dashboard.
            </p>
            <div className="mt-6 inline-block rounded-xl border border-border bg-card px-6 py-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Payment Squad Account
              </div>
              <div className="mt-1 font-display text-2xl tracking-widest text-primary">
                {virtualAccountNumber || "Pending..."}
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={() => navigate({ to: PAGES.DASHBOARD_BUSINESS })}
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

export const Route = createFileRoute("/register/business")({
  head: () => ({ meta: [{ title: "Business Sign Up — Bridge" }] }),
  component: BusinessRegister,
});
