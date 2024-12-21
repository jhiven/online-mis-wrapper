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
      from: Date;
      to: Date;
    };
    perubahan: {
      from: Date;
      to: Date;
    };
    drop: {
      from: Date;
      to: Date;
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
