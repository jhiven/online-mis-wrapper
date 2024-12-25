export type SemesterListData<T> = T & {
  semester: number[];
  year: number[];
};

export type SemesterData = { year: number; semester: number };
