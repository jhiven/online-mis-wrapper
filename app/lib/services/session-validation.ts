import * as cheerio from "cheerio";

export function validateOnlineMisSession(data: any) {
  const $ = cheerio.load(data);
  const isSessionValid =
    $("option[value='ociexecute(): ORA-00936: missing expression']").length ===
    0;

  return isSessionValid;
}
