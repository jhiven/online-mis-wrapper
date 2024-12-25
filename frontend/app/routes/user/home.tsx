import type { Route } from "./+types/home";
import { HomeService } from "~/lib/services/home";
import { OnlineMisServiceHandler } from "~/lib/services/shared/handler";

// export async function loader({ request }: Route.LoaderArgs) {
//   const service = new HomeService();
//   const handler = new OnlineMisServiceHandler(service);
//   const data = await handler.run(request, undefined);
//   return data;
// }

export default function Home() {
  return <div>Selamat Datang di Online.MIS PENS</div>;
}
