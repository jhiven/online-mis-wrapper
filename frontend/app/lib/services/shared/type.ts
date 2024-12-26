export type SemesterListData<T> = T & {
  semester: number[];
  year: number[];
};

export type SemesterData = { year: number; semester: number };

export type SemesterLoaderType<T> = {
  success?: { data: T; year: number; semester: number };
  error?: string;
};

export type ApiResponse<T> = {
  status: number;
  data?: T;
  message?: string;
  cause?: string;
};
