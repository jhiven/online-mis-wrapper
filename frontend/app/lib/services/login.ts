import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";

export type LoginResponseData = {
  user: string;
  nrp: string;
  sessionId: string;
};

export async function loginCas({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const jar = new CookieJar();
    const axiosInstance = wrapper(axios.create({ jar }));

    const getRes = await axiosInstance.get(
      "https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1"
    );

    const $ = cheerio.load(getRes.data);
    const lt = $("[name='lt']").attr("value");
    const sessionId = (getRes.headers["set-cookie"] as string[])
      .find((cookie) => cookie.includes("JSESSIONID"))
      ?.match(new RegExp(`^${"JSESSIONID"}=(.+?);`))?.[1];

    if (!lt) {
      throw new Error("Failed to get lt");
    }
    if (!sessionId) {
      throw new Error("Failed to get sessionId");
    }

    const payload = {
      username: email,
      password: password,
      _eventId: "submit",
      submit: "LOGIN",
      lt: lt,
    };

    const loginRes = await axiosInstance.post(
      "https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1",
      payload,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Connection: "keep-alive",
          Origin: "https://login.pens.ac.id",
          Referer:
            "https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1",
          Cookie: `JSESSIONID=${sessionId};`,
        },
        withCredentials: true,
      }
    );

    const $loginElement = cheerio.load(loginRes.data);
    const error = $loginElement(".errors").text() || null;
    if (error) {
      return { user: undefined, casCookie: undefined, error };
    }

    const user = $loginElement(".userout a").text().split(":")[1].trim();
    const casCookie = loginRes.config.jar?.getCookiesSync(
      "https://online.mis.pens.ac.id"
    );

    return { user, casCookie, error };
  } catch (error) {
    throw error;
  }
}
