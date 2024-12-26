import type { SemesterListData } from "../../shared/type";

export type FRSData = SemesterListData<{
  dosen: string;
  sks: {
    batas: number;
    sisa: number;
  };
  ip: {
    ipk: number;
    ips: number;
  };
  tanggalPenting: {
    pengisian: {
      from: string;
      to: string;
    };
    perubahan: {
      from: string;
      to: string;
    };
    drop: {
      from: string;
      to: string;
    };
  };
  table: {
    id: string;
    kode: string;
    group: string;
    mataKuliah: {
      nama: string;
      hari: string;
      jam: string;
    };
    dosen: string;
    sks: string;
    kelas: string;
    disetujui: string;
  }[];
}>;
