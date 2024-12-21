import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { id } from "date-fns/locale/id";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return format(date, "dd MMMM yyyy", { locale: id });
}

export const semesterData: Record<number, string> = {
  1: "Ganjil",
  2: "Genap",
  3: "Ganjil Antara",
  4: "Genap Antara",
};
