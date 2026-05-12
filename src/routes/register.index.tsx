import { createFileRoute, Link } from "@tanstack/react-router";
import { PAGES } from "@/lib/constants";
import { TrendingUp, Store } from "lucide-react";

const RegisterOptions = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 bg-grain">
      <div className="max-w-4xl w-full text-center">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">
          How are you planning to use Bridge?
        </h1>
        <p className="mt-4 text-muted-foreground text-lg">
          Choose your account type to get started with transparent revenue-share deals.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
          <Link
            to={PAGES.REGISTER_INVESTOR}
            className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-8 md:p-10 transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h2 className="mt-8 font-display text-2xl group-hover:text-primary transition-colors">
                For personal use
              </h2>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary opacity-90">
                Investor Account
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                For individuals who want to build and experiment with their own projects by backing
                vetted local businesses and earning automated monthly returns.
              </p>
            </div>
            <div className="mt-8 font-medium text-sm text-primary flex items-center gap-1 group-hover:underline">
              Continue as Investor →
            </div>
          </Link>

          <Link
            to={PAGES.REGISTER_BUSINESS}
            className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-8 md:p-10 transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div>
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Store className="h-7 w-7" />
              </div>
              <h2 className="mt-8 font-display text-2xl group-hover:text-primary transition-colors">
                With my team
              </h2>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary opacity-90">
                Business Account
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                For organizations who want to collaborate and build at scale by raising fair,
                uncollateralized growth capital against their existing bank revenue stream.
              </p>
            </div>
            <div className="mt-8 font-medium text-sm text-primary flex items-center gap-1 group-hover:underline">
              Continue as Business →
            </div>
          </Link>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to={PAGES.LOGIN} className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/register/")({
  head: () => ({ meta: [{ title: "Sign Up — Bridge" }] }),
  component: RegisterOptions,
});
