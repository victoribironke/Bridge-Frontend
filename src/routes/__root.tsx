import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider, useAuth, type UserType } from "@/lib/auth";
import { PAGES } from "@/lib/constants";

const NotFoundComponent = () => {
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
            to={PAGES.HOME}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
};

const ErrorComponent = ({ error, reset }: { error: Error; reset: () => void }) => {
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
};

const RootShell = ({ children }: { children: React.ReactNode }) => {
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
};

const RootComponent = () => {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteChrome />
      </AuthProvider>
    </QueryClientProvider>
  );
};

const SiteChrome = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const Header = () => {
  const { userType, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: PAGES.HOME });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to={PAGES.HOME} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-display text-lg">
            B
          </span>
          <span className="font-display text-xl tracking-tight">Bridge</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex text-sm">
          {userType === "investor" && (
            <>
              <Link
                to={PAGES.DASHBOARD_INVESTOR}
                className="text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Browse
              </Link>
              <Link
                to={PAGES.DASHBOARD_INVESTOR_PORTFOLIO}
                className="text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Portfolio
              </Link>
              <Link
                to={PAGES.NOTIFICATIONS}
                className="text-muted-foreground hover:text-foreground"
              >
                Notifications
              </Link>
            </>
          )}
          {userType === "business" && (
            <>
              <Link
                to={PAGES.DASHBOARD_BUSINESS}
                className="text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Dashboard
              </Link>
              <Link
                to={PAGES.DASHBOARD_BUSINESS_PAYMENTS}
                className="text-muted-foreground hover:text-foreground"
              >
                Payments
              </Link>
              <Link
                to={PAGES.NOTIFICATIONS}
                className="text-muted-foreground hover:text-foreground"
              >
                Notifications
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {userType !== "guest" ? (
            <button
              onClick={handleLogout}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                to={PAGES.LOGIN}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Log in
              </Link>
              <Link
                to={PAGES.REGISTER}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer = () => {
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
};

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
