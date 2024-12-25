import { createCookieSessionStorage } from "react-router";

type SessionData = { PHPSESSID: string; user: string };

export const sessionStorage = createCookieSessionStorage<SessionData>({
  cookie: {
    name: "session",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    secrets: ["lODSFhasdfdjf132afds_ljouoviu1"],
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
