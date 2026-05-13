import { createFileRoute } from "@tanstack/react-router";

const p = "mt-4 text-sm leading-relaxed text-foreground/90 md:text-base";
const subheading = "mt-8 font-display text-xl font-semibold tracking-tight text-foreground";

const Terms = () => {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">Terms</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        How Bridge works for investors and businesses on the platform.
      </p>

      <div className="mt-10 space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Investor terms
          </h2>

          <h3 className={subheading}>What you&apos;re doing</h3>
          <p className={p}>
            You&apos;re giving capital to a business. In return, you get that capital back plus a
            22% return on what you put in. You do not own any part of the business. They don&apos;t
            owe you beyond the agreed amount.
          </p>

          <h3 className={subheading}>Your return</h3>
          <p className={p}>
            The 22% is calculated on your specific commitment. Put in ₦200,000 and you&apos;re owed
            ₦244,000 total. That number is locked when you invest.
          </p>

          <h3 className={subheading}>Minimum</h3>
          <p className={p}>₦5,000 per listing.</p>

          <h3 className={subheading}>Default protection pool</h3>
          <p className={p}>
            4% of your committed amount goes into a platform protection pool. Your ownership share
            and return are calculated on your full commitment, so this doesn&apos;t reduce what
            you&apos;re owed. It just sits as a buffer if other deals on the platform go bad.
          </p>

          <h3 className={subheading}>Your share of each sweep</h3>
          <p className={p}>
            Your share of every repayment is proportional to what you put in relative to the total
            listing. Two investors with the same 22% return expectation will receive different
            amounts from each payment if one committed more than the other. That&apos;s how the math
            is supposed to work.
          </p>

          <h3 className={subheading}>How repayments come in</h3>
          <p className={p}>
            Repayments are tied to the business&apos;s revenue, not a fixed calendar. When the
            business gets paid, a portion of that payment is swept and split among investors. Your
            cut of each sweep depends on your share percentage.
          </p>

          <h3 className={subheading}>Timing</h3>
          <p className={p}>
            Each listing has a target repayment horizon, but it&apos;s an estimate. If the business
            has a slow month, sweeps are smaller. Your full return may take longer than projected.
          </p>

          <h3 className={subheading}>Your funds are locked</h3>
          <p className={p}>
            Once you commit, that&apos;s it. You can&apos;t withdraw early. You&apos;re in until the
            listing is fully repaid or defaults.
          </p>

          <h3 className={subheading}>If the deal goes bad</h3>
          <p className={p}>
            The default pool exists to cover partial losses. It doesn&apos;t guarantee your full
            return. If the business can&apos;t repay, you may get back less than you&apos;re owed.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Business terms
          </h2>

          <h3 className={subheading}>What you&apos;re taking on</h3>
          <p className={p}>
            Capital from a pool of investors, repaid through a cut of your revenue until the full
            amount is cleared. You keep your equity. No one is buying into your business.
          </p>

          <h3 className={subheading}>How your terms are calculated</h3>
          <p className={p}>
            Your return rate, revenue share percentage, and estimated repayment timeline are set by
            the platform based on your Bridge credit score and financial data. You don&apos;t
            negotiate these. They&apos;re computed at listing time.
          </p>

          <h3 className={subheading}>Capital comes in stages</h3>
          <p className={p}>
            You don&apos;t get everything the moment your listing is funded. Here&apos;s how it
            releases:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/90 md:text-base">
            <li>40% when the listing reaches full funding</li>
            <li>30% after your 2nd sweep payment clears</li>
            <li>30% after your 4th sweep payment clears</li>
          </ul>

          <h3 className={subheading}>Revenue sweeps</h3>
          <p className={p}>
            Between 3% and 15% of each incoming payment to your account is automatically swept
            toward repayment. The exact percentage is set when your listing is created. It can shift
            slightly per transaction depending on payment size, but stays within a defined range.
          </p>

          <h3 className={subheading}>Total amount owed</h3>
          <p className={p}>
            You repay the full capital plus the return percentage agreed at listing time. The target
            repayment months is an estimate based on your average revenue. If revenue drops,
            repayment takes longer, but the obligation doesn&apos;t change.
          </p>

          <h3 className={subheading}>Investors can see your repayment progress</h3>
          <p className={p}>
            Every sweep event on your listing is visible to investors. They can see the amounts and
            timing. They can&apos;t touch your operations, but they can see whether you&apos;re
            repaying.
          </p>

          <h3 className={subheading}>Keep your account active</h3>
          <p className={p}>
            Further tranches only release if your listing stays active and your account is in good
            standing. Issues with your virtual account can block capital disbursements.
          </p>
        </section>
      </div>
    </div>
  );
};

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — Bridge" }] }),
  component: Terms,
});
