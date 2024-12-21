import type { SemesterListData } from "../../shared/type";

export type NilaiSemesterData = SemesterListData<{
  table: { kode: string; mataKuliah: string; value: string }[];
}>;
