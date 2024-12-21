import type { OnlineMisService } from "../../shared/service";
import type { SemesterData, SemesterListData } from "../../shared/type";
import type { FRSData } from "./type";
import axios, { type AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import { parse } from "date-fns";

export class FrsOnlineMBKMService
  implements OnlineMisService<FRSData, SemesterData>
{
  async request({
    cookie,
    semester,
    year,
  }: SemesterData & { cookie: string }): Promise<AxiosResponse> {
    return await axios.get(
      `https://online.mis.pens.ac.id/FRS_mbkm.php?valTahun=${year}&valSemester=${semester}`,
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

  extractor(data: any): FRSData {
    const $ = cheerio.load(data);

    const dosen = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(2) > font:nth-child(1)"
    ).text();

    const sks = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(6) > td:nth-child(2) > font:nth-child(1)"
    )
      .text()
      .trim()
      .split(" ");

    const ip = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(2) > font:nth-child(1)"
    )
      .text()
      .trim()
      .split(" ");

    const tanggalPengisian = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(2)"
    )
      .text()
      .trim()
      .split("sd")
      .map((el) => el.trim());

    const tanggalPerubahan = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(4)"
    )
      .text()
      .trim()
      .split("sd")
      .map((el) => el.trim());

    const tanggalDrop = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(6)"
    )
      .text()
      .trim()
      .split("sd")
      .map((el) => el.trim());

    const table: FRSData["table"] = $(
      "table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(10) > td:nth-child(2) > table:nth-child(1) > tbody > tr:not(:first-child):not(:last-child)"
    )
      .map((i, el) => {
        const $el = $(el);
        const kelas = $el
          .find("td:nth-child(5) font")
          .contents()
          .toString()
          .split("<br>");

        return {
          id: $el.find("td:nth-child(1) a").attr("href")?.split("=")[1] ?? "",
          kode: $el.find("td:nth-child(3) font").text().trim(),
          group: $el.find("td:nth-child(4) font").text().trim(),
          mataKuliah: {
            nama: kelas[0],
            hari: kelas[1].split(":")[1].trim(),
            jam: kelas[2].split(" : ")[1].trim(),
          },
          dosen: $el.find("td:nth-child(6) font").text().trim(),
          sks: $el.find("td:nth-child(7) font").text().trim(),
          kelas: $el.find("td:nth-child(8) font").text().trim(),
          disetujui: $el.find("td:nth-child(9) font").text().trim(),
        };
      })
      .toArray();

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

    return {
      semester,
      year,
      dosen,
      sks: {
        batas: Number(sks[0]),
        sisa: Number(sks[2]),
      },
      ip: {
        ipk: Number(ip[0]),
        ips: Number(ip[2]),
      },
      tanggalPenting: {
        pengisian: {
          from: parse(tanggalPengisian[0], "dd-MM-yyyy", new Date()),
          to: parse(tanggalPengisian[1], "dd-MM-yyyy", new Date()),
        },
        perubahan: {
          from: parse(tanggalPerubahan[0], "dd-MM-yyyy", new Date()),
          to: parse(tanggalPerubahan[1], "dd-MM-yyyy", new Date()),
        },
        drop: {
          from: parse(tanggalDrop[0], "dd-MM-yyyy", new Date()),
          to: parse(tanggalDrop[1], "dd-MM-yyyy", new Date()),
        },
      },
      table,
    };
  }
}
