import { clsx, type ClassValue } from "clsx";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale/id";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const semesterData: Record<number, string> = {
  1: "Ganjil",
  2: "Genap",
  3: "Ganjil Antara",
  4: "Genap Antara",
};

export function formatDateToId(date: string) {
  return format(parse(date, "dd-MM-yyyy", new Date()), "dd MMMM yyyy", {
    locale: id,
  });
}
