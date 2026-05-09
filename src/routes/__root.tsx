import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { MockAuthProvider, useMockAuth, type AuthRole } from "@/lib/mock-auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bridge — Capital that meets businesses where they are" },
      {
        name: "description",
        content:
          "Bridge connects everyday Nigerian investors with vetted small businesses through revenue-share deals.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <SiteChrome />
      </MockAuthProvider>
    </QueryClientProvider>
  );
}

function SiteChrome() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const { role, setRole } = useMockAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-display text-lg">
            B
          </span>
          <span className="font-display text-xl tracking-tight">Bridge</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex text-sm">
          {role === "guest" && (
            <>
              <Link to="/register/business" className="text-muted-foreground hover:text-foreground">
                For businesses
              </Link>
              <Link to="/register/investor" className="text-muted-foreground hover:text-foreground">
                For investors
              </Link>
            </>
          )}
          {role === "investor" && (
            <>
              <Link
                to="/dashboard/investor"
                className="text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Browse
              </Link>
              <Link
                to="/dashboard/investor/portfolio"
                className="text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Portfolio
              </Link>
              <Link to="/notifications" className="text-muted-foreground hover:text-foreground">
                Notifications
              </Link>
            </>
          )}
          {role === "business" && (
            <>
              <Link
                to="/dashboard/business"
                className="text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/business/payments"
                className="text-muted-foreground hover:text-foreground"
              >
                Payments
              </Link>
              <Link to="/notifications" className="text-muted-foreground hover:text-foreground">
                Notifications
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <RoleSwitch value={role} onChange={setRole} />
        </div>
      </div>
    </header>
  );
}

function RoleSwitch({ value, onChange }: { value: AuthRole; onChange: (r: AuthRole) => void }) {
  const opts: { value: AuthRole; label: string }[] = [
    { value: "guest", label: "Guest" },
    { value: "investor", label: "Investor" },
    { value: "business", label: "Business" },
  ];
  return (
    <div className="hidden md:flex items-center rounded-full border border-border bg-card p-0.5 text-xs">
      <span className="px-2 text-muted-foreground">Mock auth</span>
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={
            "rounded-full px-3 py-1 transition-colors " +
            (value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between text-sm text-muted-foreground">
        <div>
          © {new Date().getFullYear()} Bridge. Capital that meets businesses where they are.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">
            Terms
          </a>
          <a href="#" className="hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
