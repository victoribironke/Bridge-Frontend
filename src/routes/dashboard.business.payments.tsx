/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useBusinessPaymentLink,
  useBusinessSweepSummary,
  useBusinessPayments,
} from "@/hooks/queries";
import { useAuth } from "@/lib/auth";
import { formatNaira, formatNairaFull } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const Payments = () => {
  const { virtualAccountNumber } = useAuth();
  const { data: linkData, isLoading: isLinkLoading } = useBusinessPaymentLink();
  const { data: sweepSummary, isLoading: isSweepLoading } = useBusinessSweepSummary();
  const { data: paymentsData, isLoading: isPaymentsLoading } = useBusinessPayments();

  const link = linkData?.paymentLink || "https://bridge.invest/p/placeholder";
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;
  const [copied, setCopied] = useState(false);

  const payments = paymentsData || [];

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
          {isLinkLoading ? (
            <div className="mx-auto flex h-60 w-60 items-center justify-center rounded-lg border border-border bg-secondary/50">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <img
              src={qr}
              alt="Payment QR code"
              className="mx-auto rounded-lg border border-border"
              width={240}
              height={240}
            />
          )}
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
              {isLinkLoading ? "Loading link..." : link}
            </code>
            <button
              onClick={copy}
              disabled={isLinkLoading}
              className="rounded-md border border-input px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={share}
              disabled={isLinkLoading}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Share
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            When customers pay through this link, the money lands in your Bridge Squad account (
            <span className="font-medium text-foreground">{virtualAccountNumber || "Pending"}</span>
            ). The platform automatically sweeps the agreed share to investors. Nothing for you to
            do.
          </p>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-3 gap-4">
        {isSweepLoading ? (
          <div className="col-span-3 flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Stat label="Swept to date" value={formatNaira(sweepSummary?.totalSweptKobo || 0)} />
            <Stat
              label="Remaining to sweep"
              value={formatNaira(sweepSummary?.totalRemainingKobo || 0)}
            />
            <Stat label="Current sweep" value={`${sweepSummary?.currentSweepPercent || 0}%`} />
          </>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl">Recent payments</h2>
        {isPaymentsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : payments.length === 0 ? (
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
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="py-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>{formatNairaFull(p.incomingKobo)}</td>
                    <td>{p.sweepApplied ? formatNairaFull(p.sweepKobo) : "—"}</td>
                    <td className="font-medium">{formatNairaFull(p.netKobo)}</td>
                    <td>
                      <span
                        className={
                          "text-xs " + (p.sweepApplied ? "text-success" : "text-muted-foreground")
                        }
                      >
                        {p.sweepApplied ? "✓ Sweep processed" : "No sweep applied"}
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
