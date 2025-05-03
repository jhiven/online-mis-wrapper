import type { paths } from "@/openapi/openapi-schema";
import createFetchClient, { type Middleware } from "openapi-fetch";
import createClient from "openapi-react-query";

const fetchClient = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
});

const AuthMiddleware: Middleware = {
  onResponse: async ({ response }) => {
    if (response.status === 401) {
      window.location.href = "/login";
    }

    return;
  },
};

fetchClient.use(AuthMiddleware);

export const queryApi = createClient(fetchClient);
export { fetchClient };
