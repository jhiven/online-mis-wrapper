import type { Route } from "./+types/logout";
import { Outlet, redirect, redirectDocument } from "react-router";
import { destroySession, getSession } from "~/lib/cookie";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("cookie"));

  if (!(session.has("PHPSESSID") && session.has("user")))
    return redirect("/login");
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("cookie"));

  return redirectDocument("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}

export default function Logout() {
  return <Outlet />;
}
