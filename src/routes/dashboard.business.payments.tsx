import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  businessPayments,
  businessProfile,
  businessSweepSummary,
  formatNaira,
  formatNairaFull,
} from "@/lib/mock-data";

const Payments = () => {
  const link = businessProfile.paymentLink;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };
  const share = async () => {
    if (navigator.share)
      await navigator.share({ title: "Pay me on Bridge", url: link }).catch(() => {});
    else copy();
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl">Payments</h1>

      <section className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <img
            src={qr}
            alt="Payment QR code"
            className="mx-auto rounded-lg border border-border"
            width={240}
            height={240}
          />
          <a
            href={qr}
            download="bridge-payment-qr.png"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Download QR
          </a>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Payment link</div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-secondary px-3 py-2 text-sm">
              {link}
            </code>
            <button
              onClick={copy}
              className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={share}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Share
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            When customers pay through this link, the money lands in your Bridge Squad account (
            {businessProfile.squadAccount}). The platform automatically sweeps the agreed share to
            investors. Nothing for you to do.
          </p>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-3 gap-4">
        <Stat label="Swept to date" value={formatNaira(businessSweepSummary.totalSwept)} />
        <Stat label="Remaining to sweep" value={formatNaira(businessSweepSummary.totalRemaining)} />
        <Stat label="Current sweep" value={`${businessSweepSummary.currentSweepPct}%`} />
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Recent payments</h2>
        {businessPayments.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Payment history will appear here after your first customer pays through the link.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Date</th>
                  <th>Incoming</th>
                  <th>Sweep</th>
                  <th>Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {businessPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3">{p.date}</td>
                    <td>{formatNairaFull(p.incoming)}</td>
                    <td>{p.applied ? formatNairaFull(p.sweep) : "—"}</td>
                    <td className="font-medium">{formatNairaFull(p.net)}</td>
                    <td>
                      <span
                        className={
                          "text-xs " + (p.applied ? "text-success" : "text-muted-foreground")
                        }
                      >
                        {p.applied ? "✓ Sweep processed" : "No sweep applied"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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

export const Route = createFileRoute("/dashboard/business/payments")({
  head: () => ({ meta: [{ title: "Payments — Bridge" }] }),
  component: Payments,
});
