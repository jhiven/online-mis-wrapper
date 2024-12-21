import type { AxiosResponse } from "axios";

export interface OnlineMisService<T, U = undefined> {
  request({ cookie }: U & { cookie: string }): Promise<AxiosResponse>;
  extractor(data: any): T;
}
