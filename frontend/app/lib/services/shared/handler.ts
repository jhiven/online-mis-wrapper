import type { OnlineMisService } from "./service";
import * as cheerio from "cheerio";
import { redirectDocument } from "react-router";
import { destroySession, getSession } from "~/lib/cookie";

export class OnlineMisServiceHandler<T, U = undefined> {
  private _service: OnlineMisService<T, U>;

  constructor(service: OnlineMisService<T, U>) {
    this._service = service;
  }

  private validateOnlineMisSession(data: any) {
    const $ = cheerio.load(data);

    let isSessionValid =
      $("option[value='ociexecute(): ORA-00936: missing expression']")
        .length === 0;
    if (!isSessionValid) return isSessionValid;

    isSessionValid =
      $("#app-name").text().trim() !==
      "EEPIS Central Authentication Service (CAS)";
    return isSessionValid;
  }

  async run(request: Request, data: U): Promise<T> {
    const session = await getSession(request.headers.get("Cookie"));
    const cookie = session.get("PHPSESSID") ?? "";
    const res = await this._service.request({ cookie, ...data });

    if (!this.validateOnlineMisSession(res.data)) {
      throw redirectDocument("/login", {
        headers: { "Set-Cookie": await destroySession(session) },
      });
    }

    return this._service.extractor(res.data);
  }
}
