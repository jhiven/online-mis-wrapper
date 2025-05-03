import { DataTable } from "@/components/ui/data-table";
import TableYearSemester from "@/components/year-semester-select";
import { queryApi } from "@/lib/api";
import { formatDateToId } from "@/lib/utils";
import type { paths } from "@/openapi/openapi-schema";
import { yearSemesterSchema } from "@/schema/year-semester-schema";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { Suspense } from "react";

export const Route = createFileRoute("/_user/academic/frs-online-mbkm")({
  component: RouteComponent,
  validateSearch: zodValidator(yearSemesterSchema),
  loaderDeps: ({ search: { semester, year } }) => ({ semester, year }),
  loader: ({
    context: { queryClient },
    deps: { semester, year },
    abortController,
  }) => {
    queryClient.prefetchQuery(
      queryApi.queryOptions("get", "/api/v1/academic/frs", {
        params: { query: { semester, year } },
        signal: abortController.signal,
      })
    );
  },
});

type FrsOnlineMbkmResponse =
  paths["/api/v1/academic/frs"]["get"]["responses"]["200"]["content"]["application/json"];

const columns: ColumnDef<FrsOnlineMbkmResponse["data"]["table"][number]>[] = [
  {
    id: "no",
    header: "No",
    cell: ({ row, table }) => (
      <p className="text-center">
        {(table
          .getSortedRowModel()
          ?.flatRows?.findIndex((flatRow) => flatRow.id === row.id) || 0) + 1}
      </p>
    ),
  },
  {
    accessorKey: "kode",
    header: "Kode MK",
    cell: ({ row }) => <p className="text-center">{row.original.kode}</p>,
  },
  {
    accessorKey: "group",
    header: "MK Group",
    cell: ({ row }) => <p className="text-center">{row.original.group}</p>,
  },
  {
    accessorKey: "mataKuliah",
    header: "Mata Kuliah - Hari - Jam",
    cell: ({ row: { original: frs } }) => (
      <div className="min-w-48">
        <p className="font-medium">{frs.mataKuliah.nama}</p>
        <p>{frs.mataKuliah.hari}</p>
        <p>{frs.mataKuliah.jam}</p>
      </div>
    ),
  },
  {
    accessorKey: "dosen",
    header: "Dosen",
    cell: ({ row }) => <p className="text-center">{row.original.dosen}</p>,
  },
  {
    accessorKey: "sks",
    header: "SKS",
    cell: ({ row }) => <p className="text-center">{row.original.sks}</p>,
  },
  {
    accessorKey: "kelas",
    header: "Kelas",
    cell: ({ row }) => <p className="text-center">{row.original.kelas}</p>,
  },
  {
    accessorKey: "disetujui",
    header: "Disetujui",
    cell: ({ row }) => <p className="text-center">{row.original.disetujui}</p>,
  },
];

function RouteContent() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: {
      data: { semester, table, year, dosen, ip, sks, tanggalPenting },
    },
  } = queryApi.useSuspenseQuery("get", "/api/v1/academic/frs", {
    params: {
      query: { semester: searchParams.semester, year: searchParams.year },
    },
  });

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
      >
        {table.length ? (
          <>
            <tr>
              <td className="p-2 align-top">Dosen Wali</td>
              <td className="p-2 align-top">{dosen}</td>
            </tr>
            <tr>
              <td className="p-2 align-top">SKS yang diambil / batas SKS</td>
              <td className="p-2 align-top">
                {sks.batas - sks.sisa} / {sks.batas} SKS
              </td>
            </tr>
            <tr>
              <td className="p-2 align-top">IPK</td>
              <td className="p-2 align-top">{ip.ipk}</td>
            </tr>
            <tr>
              <td className="p-2 align-top">IPS Semester Lalu</td>
              <td className="p-2 align-top">{ip.ips}</td>
            </tr>
            <tr>
              <td className="p-2 align-top">Tanggal Penting</td>
              <td className="p-2 align-top">
                <div>
                  <strong>Pengisian:</strong>{" "}
                  {formatDateToId(tanggalPenting.pengisian.from)} -{" "}
                  {formatDateToId(tanggalPenting.pengisian.to)}
                </div>
                <div>
                  <strong>Perubahan:</strong>{" "}
                  {formatDateToId(tanggalPenting.perubahan.from)} -{" "}
                  {formatDateToId(tanggalPenting.perubahan.to)}
                </div>
                <div>
                  <strong>Drop:</strong>{" "}
                  {formatDateToId(tanggalPenting.drop.from)} -{" "}
                  {formatDateToId(tanggalPenting.drop.to)}
                </div>
              </td>
            </tr>
          </>
        ) : (
          <tr>
            <td className="p-2 text-xl text-destructive">
              Anda Belum Daftar Ulang
            </td>
          </tr>
        )}
      </TableYearSemester>

      <DataTable columns={columns} data={table} />
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
