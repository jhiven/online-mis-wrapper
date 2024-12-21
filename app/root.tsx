import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import { AxiosError, isAxiosError } from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useFetcher,
  useNavigation,
} from "react-router";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Ubuntu+Sans:ital,wght@0,100..800;1,100..800&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Online.MIS PENS" },
    {
      name: "description",
      content: "an Online MIS PENS wrapper, since the original web is suck",
    },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <GlobalLoading />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const fetcher = useFetcher();
  const [errorState, setErrorState] = useState<{
    message: string;
    status: string;
    stack?: string;
  }>({
    message: "An Unexpected Error Occurred",
    stack: "",
    status: "Oops! Something went wrong.",
  });

  useEffect(() => {
    if (isRouteErrorResponse(error)) {
      console.log("route error", error);
      setErrorState((prev) => ({
        ...prev,
        status: error.status === 404 ? "404" : "Error",
        message:
          error.status === 404
            ? "The requested page could not be found."
            : error.statusText || prev.message,
      }));
    } else if (isAxiosError(error) || error instanceof AxiosError) {
      setErrorState((prev) => ({
        ...prev,
        status: error.response?.statusText ?? "Error",
        message: error.message,
        stack: import.meta.env.DEV ? error.stack : undefined,
      }));
    } else if (import.meta.env.DEV && error && error instanceof Error) {
      console.error(errorState);
      setErrorState((prev) => ({
        ...prev,
        status: "Error",
        details: error.message,
        stack: error.stack,
      }));
    }
  }, []);

  return (
    <main className="container max-w-7xl p-4 xl:p-0 xl:py-4">
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {errorState.status}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{errorState.message}</p>
      {errorState.stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{errorState.stack}</code>
        </pre>
      )}
      <div className="mt-6">
        <Button
          onClick={() => {
            fetcher.submit({}, { action: "/logout", method: "post" });
          }}
        >
          Go to Login Page
        </Button>
      </div>
    </main>
  );
}

function GlobalLoading() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-[300px] w-full transition-all duration-300 pointer-events-none z-50 bg-black/80 dark:h-[200px] dark:!bg-white/10 dark:rounded-[100%]",
        active
          ? "delay-0 opacity-1 -translate-y-1/2"
          : "delay-300 opacity-0 -translate-y-full"
      )}
      style={{
        background: `radial-gradient(closest-side, rgba(0,10,40,0.2) 0%, rgba(0,0,0,0) 100%)`,
      }}
    >
      <div
        className={
          "absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[30px] p-2 bg-background rounded-lg shadow-lg"
        }
      >
        <Loader2 className="text-3xl animate-spin text-foreground" />
      </div>
    </div>
  );
}
