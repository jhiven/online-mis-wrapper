import type { Route } from "./+types/guest-layout";
import { Outlet, redirect } from "react-router";
import { getSession } from "~/lib/cookie";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("PHPSESSID") && session.has("user")) {
    return redirect("/");
  }
}

export default function GuestRoute() {
  return <Outlet />;
}
