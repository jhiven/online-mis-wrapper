import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Input, PasswordInput } from "./ui/input";
import { SubmitButton } from "./ui/button";
import { queryApi } from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const navigate = useNavigate({ from: "/login" });
  const { mutate, error, isPending } = queryApi.useMutation(
    "post",
    "/api/v1/auth/login",
    {
      onSuccess: () => {
        navigate({ to: "/home", replace: true });
      },
    }
  );
  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    mutate({ body: { email: data.email, password: data.password } });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
              {error?.message && (
                <div
                  className="rounded-xl bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  {error.message}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="example@it.pens.ac.id" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SubmitButton
                isLoading={isPending}
                type="submit"
                className="w-full"
              >
                Login
              </SubmitButton>
            </div>
          </div>
        </form>
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
