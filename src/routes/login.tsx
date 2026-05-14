import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Field, FormShell, GhostBtn, Input, PrimaryBtn } from "@/components/form-bits";
import { PAGES } from "@/lib/constants";
import { ApiError } from "@/lib/api-client";
import { useLoginMutation } from "@/hooks/mutations";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const loginMut = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || password.length < 8) return;

    loginMut.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.userType === "business") {
            navigate({ to: PAGES.DASHBOARD_BUSINESS });
          } else {
            navigate({ to: PAGES.DASHBOARD_INVESTOR });
          }
        },
        onError: (err) => {
          if (err instanceof ApiError && err.statusCode === 401) {
            const msg = err.message?.trim();
            toast.error(
              msg && msg.length > 0 && msg !== "Unauthorized" ? msg : "Invalid email or password.",
            );
            return;
          }
          toast.error(err instanceof Error ? err.message : "Invalid email or password.");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-lg px-6 py-20">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">Log in to your Bridge account</p>
      </div>

      <FormShell
        footer={
          <div className="flex w-full flex-col gap-4">
            <PrimaryBtn
              disabled={!email || password.length < 8 || loginMut.isPending}
              onClick={handleLogin}
              className="w-full justify-center"
            >
              {loginMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
            </PrimaryBtn>
            <div className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
              <p> Don't have an account?</p>

              <div className="flex w-full items-center justify-center flex-col gap-2 md:flex-row">
                <Link to={PAGES.REGISTER_INVESTOR} className="text-primary hover:underline">
                  <GhostBtn>Register as an investor</GhostBtn>
                </Link>
                <Link to={PAGES.REGISTER_BUSINESS} className="text-primary hover:underline">
                  <GhostBtn>Register as a business</GhostBtn>
                </Link>
              </div>
            </div>
          </div>
        }
      >
        <Field label="Email address">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </Field>
      </FormShell>
    </div>
  );
};

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Bridge" }] }),
  component: Login,
});
