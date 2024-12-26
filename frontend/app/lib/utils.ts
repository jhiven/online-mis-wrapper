import { type ClassValue, clsx } from "clsx";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale/id";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return format(parse(date, "dd-MM-yyyy", new Date()), "dd MMMM yyyy", {
    locale: id,
  });
}

export const semesterData: Record<number, string> = {
  1: "Ganjil",
  2: "Genap",
  3: "Ganjil Antara",
  4: "Genap Antara",
};

export async function fetcher({
  url,
  options,
  searchParams,
}: {
  url: string | URL;
  options?: RequestInit;
  searchParams?: string | URLSearchParams;
}) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const reqUrl = new URL(url, `${baseUrl}/api/v1/`);
  if (searchParams) {
    reqUrl.search = searchParams.toString();
  }

  const res = await fetch(reqUrl, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  return res;
}
