import type { SemesterListData } from "../../shared/type";

export enum Hari {
  MINGGU = "minggu",
  SENIN = "senin",
  SELASA = "selasa",
  RABU = "rabu",
  KAMIS = "kamis",
  JUMAT = "jumat",
  SABTU = "sabtu",
}

export type JadwalKuliahData = SemesterListData<{
  kelas: string;
  table: Record<Hari, MataKuliah[]>;
  jamIstirahat: string;
}>;

export type MataKuliah = {
  nama: string;
  dosen: string;
  jam: string;
  ruangan: string;
};
