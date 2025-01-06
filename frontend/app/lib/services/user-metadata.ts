import type { Session, SessionData } from "react-router";

export function getCurrentYearAndSemester({
  searchParams,
  session,
}: {
  searchParams: URLSearchParams;
  session: Session<SessionData, SessionData>;
}) {
  let semester =
    Number(searchParams.get("semester")) || session.get("semester") || 1;
  let year =
    Number(searchParams.get("year")) ||
    session.get("year") ||
    new Date().getFullYear();

  return { year, semester };
}
