import type { OnlineMisService } from "../shared/service";
import type { HomeData } from "./type";
import axios from "axios";
import type { AxiosResponse } from "axios";
import * as cheerio from "cheerio";

export class HomeService implements OnlineMisService<HomeData> {
  async request({ cookie }: { cookie: string }): Promise<AxiosResponse> {
    return await axios.get(
      `https://online.mis.pens.ac.id/index.php?Login=1&halAwal=1`,
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

  extractor(data: any): HomeData {
    const regex = /pausecontent\[\d+\]='(.*?)';/g;
    const $ = cheerio.load(data);

    const script = $("body script[language='JavaScript']").text();

    const pengumuman = [...script.matchAll(regex)].map(([, htmlContent]) => {
      const $ = cheerio.load(htmlContent);

      const title = $("font b").text().trim();
      const category =
        /kategori\s*:(.*?)<br>/.exec(htmlContent)?.[1]?.trim() || "";
      const sender = /oleh\s*:(.*?)<br>/.exec(htmlContent)?.[1]?.trim() || "";
      const date =
        /tanggal kirim\s*:(.*?)<br>/.exec(htmlContent)?.[1]?.trim() || "";
      const rawContent = $.root().text().replace(/\s+/g, " ").trim();
      const content = rawContent
        .replace(title, "")
        .replace(`kategori :${category}`, "")
        .replace(`oleh :${sender}`, "")
        .replace(`tanggal kirim : ${date}`, "")
        .trim();

      return { title, category, sender, date, content };
    });

    return { pengumuman };
  }
}
