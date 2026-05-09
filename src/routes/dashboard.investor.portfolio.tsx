import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { investorDeals, investorWallet, formatNaira, formatNairaFull } from "@/lib/mock-data";

const Portfolio = () => {
  const [tab, setTab] = useState<"active" | "completed" | "defaulted">("active");
  const [withdraw, setWithdraw] = useState(false);

  const lifetimeDeployed = 1_450_000;
  const lifetimeReturned = 248_300;
  const overallRoi = 17.1;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="font-display text-3xl">Your portfolio</h1>

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="Capital deployed" value={formatNaira(lifetimeDeployed)} />
        <Stat label="Returns received" value={formatNaira(lifetimeReturned)} />
        <Stat label="Completed" value={String(investorDeals.completed.length)} />
        <Stat label="Active" value={String(investorDeals.active.length)} />
        <Stat label="Overall ROI" value={`${overallRoi}%`} />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Squad wallet balance
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div className="font-display text-3xl">
              {formatNairaFull(investorWallet.squadBalance)}
            </div>
            <button
              onClick={() => setWithdraw(true)}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary"
            >
              Withdraw
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Default pool balance
          </div>
          <div className="mt-1 font-display text-3xl">
            {formatNairaFull(investorWallet.defaultPoolBalance)}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-sm">
          {(
            [
              ["active", "Active"],
              ["completed", "Completed"],
              ["defaulted", "Defaulted"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                "rounded-full px-4 py-1.5 " +
                (tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {tab === "active" && investorDeals.active.map((d) => <ActiveCard key={d.id} d={d} />)}
          {tab === "completed" &&
            investorDeals.completed.map((d) => (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl">{d.business}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Completed in {d.durationMonths} months
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl">{formatNairaFull(d.returned)}</div>
                    <div className="text-xs text-success">+{d.returnPct}% return</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Invested {formatNairaFull(d.invested)}
                </div>
              </div>
            ))}
          {tab === "defaulted" &&
            (investorDeals.defaulted.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No defaults — your default pool is ready if anything ever does.
              </div>
            ) : (
              investorDeals.defaulted.map((d) => (
                <div key={d.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl">{d.business}</h3>
                    <span className="text-xs text-destructive">
                      Net loss {formatNairaFull(d.netLoss)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <Mini label="Invested" value={formatNairaFull(d.invested)} />
                    <Mini label="Recovered" value={formatNairaFull(d.recovered)} />
                    <Mini label="Net loss" value={formatNairaFull(d.netLoss)} />
                  </div>
                </div>
              ))
            ))}
        </div>
      </section>

      {withdraw && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="font-display text-2xl">Withdraw to bank</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Withdrawals are coming soon. We'll email you when they're live.
            </p>
            <button
              onClick={() => setWithdraw(false)}
              className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ActiveCard = ({ d }: { d: (typeof investorDeals.active)[number] }) => {
  const [open, setOpen] = useState(false);
  const pct = Math.round((d.received / d.totalReturn) * 100);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl">{d.business}</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            Standing · {d.standing} · projected complete {d.projectedCompletion}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Invested</div>
          <div className="font-display text-lg">{formatNairaFull(d.invested)}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatNairaFull(d.received)} received</span>
          <span>
            {pct}% of {formatNairaFull(d.totalReturn)}
          </span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button onClick={() => setOpen(!open)} className="mt-4 text-sm text-primary hover:underline">
        {open ? "Hide details" : "Show sweep history & tranches"}
      </button>
      {open && (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sweep history
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {d.sweeps.map((s, i) => (
                <li key={i} className="flex justify-between">
                  <span>{s.date}</span>
                  <span className="font-medium">{formatNairaFull(s.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tranche status
            </div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {d.tranches.map((t) => (
                <li key={t.label} className="flex justify-between">
                  <span>{t.label}</span>
                  <span className={t.released ? "text-success" : "text-muted-foreground"}>
                    {t.released ? "Released" : "Locked"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
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

const Mini = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
};

export const Route = createFileRoute("/dashboard/investor/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Bridge" }] }),
  component: Portfolio,
});
