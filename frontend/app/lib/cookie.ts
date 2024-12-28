import { createCookieSessionStorage } from "react-router";

type SessionData = { PHPSESSID: string; user: string; nrp: string };

export const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "session",
    httpOnly: true,
    secure: false,
    path: "/",
    secrets: ["lODSFhasdfdjf132afds_ljouoviu1"],
  },
});

export function serializeCookies(data: Object) {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value} `)
    .join("; ");
}

export const { getSession, commitSession, destroySession } = sessionStorage;
