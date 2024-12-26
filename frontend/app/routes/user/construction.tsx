import type { Route } from "./+types/construction";
import { Construction } from "lucide-react";

export default function ConstructionPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col w-full h-[calc(100svh-6rem-1px)] items-center justify-center">
      <Construction className="size-24 text-primary" />
      <h1 className="text-2xl font-bold mb-2">Oops!</h1>
      <p className="text-base sm:text-lg text-center [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        This feature is under construction. Help me to develop this feature in{" "}
        <a href="https://github.com/jhiven/online-mis-wrapper" target="_blank">
          Github.
        </a>
      </p>
    </div>
  );
}
