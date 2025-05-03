import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import TableYearSemester from "@/components/year-semester-select";
import { queryApi } from "@/lib/api";
import type { paths } from "@/openapi/openapi-schema";
import { yearSemesterSchema } from "@/schema/year-semester-schema";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { ArrowUpDown } from "lucide-react";
import { Suspense } from "react";

export const Route = createFileRoute("/_user/academic/nilai-semester")({
  component: RouteComponent,
  validateSearch: zodValidator(yearSemesterSchema),
  loaderDeps: ({ search: { semester, year } }) => ({ semester, year }),
  loader: ({
    context: { queryClient },
    deps: { semester, year },
    abortController,
  }) => {
    queryClient.prefetchQuery(
      queryApi.queryOptions("get", "/api/v1/academic/nilai", {
        params: { query: { semester, year } },
        signal: abortController.signal,
      })
    );
  },
});

type NilaiSemesterResponse =
  paths["/api/v1/academic/nilai"]["get"]["responses"]["200"]["content"]["application/json"];

const columns: ColumnDef<NilaiSemesterResponse["data"]["table"][number]>[] = [
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
    accessorKey: "mataKuliah",
    cell: ({ row }) => <p className="font-medium">{row.original.mataKuliah}</p>,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mata Kuliah
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "value",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nilai
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <p className="text-center">{row.original.value}</p>,
    sortingFn: (rowA, rowB) => {
      const gradeOrder = ["A", "A-", "AB", "B+", "B", "BC", "C", "D", "E"];
      const gradeA = rowA.original.value;
      const gradeB = rowB.original.value;

      const indexA = gradeOrder.indexOf(gradeA);
      const indexB = gradeOrder.indexOf(gradeB);

      return indexA - indexB;
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
  } = queryApi.useSuspenseQuery("get", "/api/v1/academic/nilai", {
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
