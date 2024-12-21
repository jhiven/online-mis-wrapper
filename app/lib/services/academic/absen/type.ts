import type { SemesterListData } from "../../shared/type";

export type AbsenData = SemesterListData<{
  table: {
    kode: string;
    mataKuliah: string;
    minggu: string[];
    kehadiran: string;
  }[];
}>;
