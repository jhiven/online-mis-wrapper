import { PasswordInput } from "./ui/password-input";
import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

export function LoginForm({
  className,
  actionData,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  actionData?: { error?: string };
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form action="/login" method="post">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <img src="/logo_pens.png" className="size-36" />
              <span className="sr-only">Online Mis PENS</span>
            </a>
            <h1 className="text-xl font-bold">
              Selamat datang di Online MIS PENS
            </h1>
            <div className="text-center text-sm">
              Informasi akademik dan administrasi mahasiswa PENS
            </div>
          </div>
          <div className="flex flex-col gap-6">
            {actionData?.error && (
              <div
                className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
                role="alert"
              >
                {actionData.error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="example@it.pens.ac.id"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </div>
        </div>
      </Form>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
        Made by{" "}
        <a href="https://github.com/jhiven" target="_blank">
          Jhiven
        </a>{" "}
        with ❤️
      </div>
    </div>
  );
}
