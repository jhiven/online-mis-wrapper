import type { OnlineMisService } from "../../shared/service";
import type { SemesterData } from "../../shared/type";
import { Hari, type JadwalKuliahData, type MataKuliah } from "./type";
import axios from "axios";
import type { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

export class JadwalKuliahService
  implements OnlineMisService<JadwalKuliahData, SemesterData>
{
  async request({
    cookie,
    year,
    semester,
  }: SemesterData & { cookie: string }): Promise<AxiosResponse> {
    return await axios.get(
      `https://online.mis.pens.ac.id/jadwal_kul.php?valTahun=${year}&valSemester=${semester}`,
      {
        headers: {
          Cookie: `PHPSESSID=${cookie}`,
          Accept: "*/*",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
        },
      }
    );
  }

  extractor(data: any): JadwalKuliahData {
    const $ = cheerio.load(data);

    const semester = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option"
    )
      .map((_, el) => {
        const val = $(el).attr("value");
        return Number(val);
      })
      .toArray();

    const year = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option"
    )
      .map((_, el) => {
        const val = $(el).attr("value");
        return Number(val);
      })
      .toArray();

    const kelas = $(
      "table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(1) > tbody > tr > td > div > b"
    )
      .text()
      .trim();

    const jamIstirahat = $(
      "table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(9) > td > strong"
    )
      .text()
      .trim();

    const table: MataKuliah[][] = $(
      "body > table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(2) > tbody > tr:not(:first-child):not(:last-child)"
    )
      .map((i, el) => {
        const listMatakuliahPerHari: MataKuliah[] = $(el)
          .find("tr:nth-child(odd) > td:nth-child(2) > div")
          .map((_, el) => {
            const matkul = $(el).contents().toString().split("<br>");

            const nama = matkul[0].trim();
            const dosen = matkul[1].split("-")[0].trim();
            const jam = matkul[1].split("-")[1].trim();
            const ruangan = matkul[2].trim();

            return { nama, dosen, jam, ruangan };
          })
          .toArray();

        return [listMatakuliahPerHari];
      })
      .toArray();

    return {
      semester,
      year,
      kelas,
      jamIstirahat,
      table: {
        minggu: table[0],
        senin: table[1],
        selasa: table[2],
        rabu: table[3],
        kamis: table[4],
        jumat: table[5],
        sabtu: table[6],
      },
    };
  }
}
