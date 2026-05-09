import { type ReactNode } from "react";

export const Stepper = ({ steps, current }: { steps: string[]; current: number }) => {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={
                "grid h-7 w-7 place-items-center rounded-full text-xs font-medium " +
                (done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                    : "bg-secondary text-muted-foreground")
              }
            >
              {i + 1}
            </span>
            <span
              className={
                "hidden text-xs md:inline " + (active ? "font-medium" : "text-muted-foreground")
              }
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
};

export const FormShell = ({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h2 className="font-display text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6 space-y-4">{children}</div>
      {footer && <div className="mt-8 flex justify-between gap-3">{footer}</div>}
    </div>
  );
};

export const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) => {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
};

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring " +
        (props.className ?? "")
      }
    />
  );
};

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring " +
        (props.className ?? "")
      }
    />
  );
};

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <select
      {...props}
      className={
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring " +
        (props.className ?? "")
      }
    />
  );
};

export const PrimaryBtn = ({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 " +
        (rest.className ?? "")
      }
    >
      {children}
    </button>
  );
};

export const GhostBtn = ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center rounded-md border border-input px-5 py-2.5 text-sm font-medium hover:bg-secondary " +
        (rest.className ?? "")
      }
    >
      {children}
    </button>
  );
};
