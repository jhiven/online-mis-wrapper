import type { Route } from "./+types/login";
import { redirect } from "react-router";
import { LoginForm } from "~/components/login-form";
import { commitSession, getSession } from "~/lib/cookie";
import { loginCas } from "~/lib/services/login";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const { casCookie, user, error } = await loginCas({
    email: form.get("email") as string,
    password: form.get("password") as string,
  });

  if (error) return { error };
  if (!casCookie) return { error: "Gagal mendapatkan cookie" };

  const session = await getSession(request.headers.get("Cookie"));
  session.set("PHPSESSID", casCookie[0].value);
  session.set("user", user);

  return redirect("/", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function LoginPage({ actionData }: Route.ComponentProps) {
  const data = actionData as { error?: string } | undefined;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm actionData={data} />
      </div>
    </div>
  );
}
