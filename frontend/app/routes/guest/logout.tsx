import type { Route } from "./+types/logout";
import { redirect, redirectDocument } from "react-router";
import { destroySession, getSession, serializeCookies } from "~/lib/cookie";
import type { ApiResponse } from "~/lib/services/shared/type";
import { fetcher } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("cookie"));

  if (!(session.has("PHPSESSID") && session.has("user")))
    return redirect("/login");
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("cookie"));

  const res = await fetcher({
    url: "logout",
    options: {
      method: "POST",
      headers: { Cookie: serializeCookies(session.data) },
    },
  });
  const _ = (await res.json()) as ApiResponse<string>;

  return redirectDocument("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
