import Navbar from "@/components/navbar";
import Cookies from "js-cookie";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { parseSessionData } from "@/lib/session-parser";

export const Route = createFileRoute("/_user")({
  component: RouteComponent,
  beforeLoad: () => {
    if (!Cookies.get("SESSION_DATA"))
      throw redirect({ to: "/login", replace: true });
  },
});

function RouteComponent() {
  return (
    <>
      <Navbar user={parseSessionData()?.user ?? "Who Are You?"} />
      <main className="container max-w-7xl p-4 xl:p-0 xl:py-4 mx-auto">
        <Outlet />
      </main>
    </>
  );
}
