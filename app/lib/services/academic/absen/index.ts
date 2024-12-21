import type { OnlineMisService } from "../../shared/service";
import type { SemesterData } from "../../shared/type";
import type { AbsenData } from "./type";
import axios from "axios";
import type { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

export class AbsenService implements OnlineMisService<AbsenData, SemesterData> {
  async request({
    cookie,
    year,
    semester,
  }: SemesterData & { cookie: string }): Promise<AxiosResponse> {
    return await axios.get(
      `https://online.mis.pens.ac.id/absen.php?valTahun=${year}&valSemester=${semester}`,
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

  extractor(data: any): AbsenData {
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

    const table: AbsenData["table"] = $(
      "table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(2) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:not(:first-child):not(:nth-child(2))"
    )
      .map((_, el) => {
        const kode = $(el).find("td:nth-child(1)").text().trim();
        const mataKuliah = $(el).find("td:nth-child(2)").text().trim();
        const minggu = $(el)
          .find("td:not(:nth-child(1)):not(:nth-child(2)):not(:last-child)")
          .map((_, el) => $(el).text().trim())
          .toArray();
        const kehadiran = $(el).find("td:last-child").text().trim();
        return { kode, mataKuliah, kehadiran, minggu };
      })
      .toArray();

    return {
      semester,
      year,
      table,
    };
  }
}
