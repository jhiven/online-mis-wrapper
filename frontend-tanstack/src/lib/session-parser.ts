import Cookies from "js-cookie";

type SessionData = {
  year: number;
  semester: number;
  week: number;
  user: string;
};

export function parseSessionData() {
  const session_data = Cookies.get("SESSION_DATA");
  if (!session_data) return;

  const data: SessionData = JSON.parse(atob(session_data));

  return data;
}
