import type { Route } from "./+types/user-layout";
import { Outlet, redirect } from "react-router";
import Navbar from "~/components/ui/navbar";
import { getSession } from "~/lib/cookie";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  if (!(session.has("PHPSESSID") && session.has("user"))) {
    throw redirect("/login");
  }

  const user = session.get("user");
  if (!user) throw redirect("/login");

  const nrp = session.get("nrp");
  if (!nrp) throw redirect("/login");

  return { user: `${user} (${nrp})` };
}

export default function UserLayout({
  loaderData: { user },
}: Route.ComponentProps) {
  return (
    <>
      <Navbar user={user} />
      <main className="container max-w-7xl p-4 xl:p-0 xl:py-4">
        <Outlet />
      </main>
    </>
  );
}
