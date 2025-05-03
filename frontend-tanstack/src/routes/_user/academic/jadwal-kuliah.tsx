import { zodValidator } from "@tanstack/zod-adapter";
import TableYearSemester from "@/components/year-semester-select";
import { queryApi } from "@/lib/api";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { yearSemesterSchema } from "@/schema/year-semester-schema";
import { Suspense } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_user/academic/jadwal-kuliah")({
  component: RouteComponent,
  validateSearch: zodValidator(yearSemesterSchema),
  loaderDeps: ({ search: { semester, year } }) => ({ semester, year }),
  loader: ({
    context: { queryClient },
    deps: { semester, year },
    abortController,
  }) => {
    queryClient.prefetchQuery(
      queryApi.queryOptions("get", "/api/v1/academic/jadwal", {
        params: { query: { semester, year } },
        signal: abortController.signal,
      })
    );
  },
});

function RouteContent() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: {
      data: { semester, table, year, jamIstirahat, kelas },
    },
  } = queryApi.useSuspenseQuery("get", "/api/v1/academic/jadwal", {
    params: {
      query: { semester: searchParams.semester, year: searchParams.year },
    },
  });

  const isTableEmpty = Object.values(table).every((v) => v.length === 0);

  return (
    <div className="space-y-6">
      <TableYearSemester
        list={{ semester, year }}
        defaultValue={{
          semester: searchParams.semester,
          year: searchParams.year,
        }}
        onValueChange={{
          semester: (val) => {
            navigate({
              search: (prev) => ({ ...prev, semester: val }),
              replace: true,
            });
          },
          year: (val) => {
            navigate({
              search: (prev) => ({ ...prev, year: val }),
              replace: true,
            });
          },
        }}
      />
      <div className="space-y-2">
        <div className="flex justify-between flex-wrap text-sm sm:text-base">
          <p>{jamIstirahat}</p>
          <p>
            Kelas: <span className="font-medium">{kelas}</span>
          </p>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Hari</TableHead>
                <TableHead className="text-center">
                  Mata Kuliah-Dosen Pengajar-Jam-Ruang
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-sm sm:text-base">
              {!isTableEmpty ? (
                Object.entries(table).map(([hari, jadwal]) =>
                  jadwal.map((matkul, i) => (
                    <TableRow key={matkul.nama}>
                      {i === 0 && (
                        <TableCell
                          className="text-center min-w-28"
                          rowSpan={jadwal.length}
                        >
                          {hari[0].toUpperCase() + hari.slice(1)}
                        </TableCell>
                      )}
                      <TableCell className="min-w-52">
                        <p className="font-medium">{matkul.nama}</p>
                        <p>{matkul.dosen}</p>
                        <p>{matkul.jam}</p>
                        <p>{matkul.ruangan}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouteContent />
    </Suspense>
  );
}
