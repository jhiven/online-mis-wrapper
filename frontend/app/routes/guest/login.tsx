import type { Route } from "./+types/login";
import { redirect } from "react-router";
import { LoginForm } from "~/components/login-form";
import { commitSession, getSession } from "~/lib/cookie";
import type { LoginResponseData } from "~/lib/services/login";
import type { ApiResponse } from "~/lib/services/shared/type";
import { fetcher } from "~/lib/utils";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const res = await fetcher({
    url: "login",
    options: {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form)),
    },
  });

  const json = (await res.json()) as ApiResponse<LoginResponseData>;

  if (!res.ok || json.message || !json.data) {
    return { error: json.message ?? "Terjadi kesalahan" };
  }

  const { nrp, user, sessionId, year, semester } = json.data;
  const session = await getSession(request.headers.get("Cookie"));
  session.set("nrp", nrp);
  session.set("user", user);
  session.set("PHPSESSID", sessionId);
  session.set("year", year);
  session.set("semester", semester);

  throw redirect("/", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm actionData={actionData} />
      </div>
    </div>
  );
}
