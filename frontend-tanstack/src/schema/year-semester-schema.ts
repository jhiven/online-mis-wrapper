import { parseSessionData } from "@/lib/session-parser";
import { z } from "zod";

export const yearSemesterSchema = z.object({
  year: z
    .number()
    .min(1988)
    .catch(() => parseSessionData()!.year),
  semester: z
    .number()
    .min(1)
    .catch(() => parseSessionData()!.semester),
});
