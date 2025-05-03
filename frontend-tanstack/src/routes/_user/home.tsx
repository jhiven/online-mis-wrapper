import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_user/home")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Selamat Datang di Online.MIS PENS</div>;
}
