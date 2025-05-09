import { DataTable } from "@/components/ui/data-table";
import { zodValidator } from "@tanstack/zod-adapter";
import TableYearSemester from "@/components/year-semester-select";
import { queryApi } from "@/lib/api";
import type { paths } from "@/openapi/openapi-schema";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { yearSemesterSchema } from "@/schema/year-semester-schema";
import { Suspense } from "react";

export const Route = createFileRoute("/_user/academic/absen")({
  component: RouteComponent,
  validateSearch: zodValidator(yearSemesterSchema),
  loaderDeps: ({ search: { semester, year } }) => ({ semester, year }),
  loader: ({
    context: { queryClient },
    deps: { semester, year },
    abortController,
  }) => {
    queryClient.prefetchQuery(
      queryApi.queryOptions("get", "/api/v1/academic/absen", {
        params: { query: { semester, tahun: year } },
        signal: abortController.signal,
      })
    );
  },
});

type AbsenResponse =
  paths["/api/v1/academic/absen"]["get"]["responses"]["200"]["content"]["application/json"];

const columns: ColumnDef<AbsenResponse["data"]["table"][number]>[] = [
  {
    accessorKey: "kode",
    header: "Kode MK",
    cell: ({ row }) => <p className="text-center">{row.original.kode}</p>,
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "mataKuliah",
    header: "Mata Kuliah",
    cell: ({ row }) => <p className="min-w-36">{row.original.mataKuliah}</p>,
  },
  {
    header: "Minggu ke",
    columns: Array(16)
      .fill(null)
      .map((_, i) => ({
        accessorKey: "minggu",
        id: i.toString(),
        header: () => (
          <span>
            {i === 6 ? `${i + 1}/UTS` : i === 13 ? `${i + 1}/UAS` : `${i + 1}`}
          </span>
        ),
        cell: ({ row }) => (
          <p className="text-center">{row.original.minggu.at(i)}</p>
        ),
        meta: {
          headerClassName: "text-center w-12",
          cellClassName: "text-center",
        },
      })),
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "kehadiran",
    header: "Kehadiran",
    cell: ({ row }) => <p className="text-center">{row.original.kehadiran}</p>,
    meta: {
      headerClassName: "text-center",
      cellClassName: "text-center",
    },
  },
];

function RouteContent() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: {
      data: { semester, table, year },
    },
  } = queryApi.useSuspenseQuery("get", "/api/v1/academic/absen", {
    params: {
      query: { semester: searchParams.semester, tahun: searchParams.year },
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
      />
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
