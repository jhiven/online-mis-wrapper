import type { Route } from "./+types/nilai-semester";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { redirectDocument } from "react-router";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import TableYearSemester from "~/components/year-semester-select";
import { destroySession, getSession, serializeCookies } from "~/lib/cookie";
import type { NilaiSemesterData } from "~/lib/services/academic/nilai-semester/type";
import type {
  ApiResponse,
  SemesterLoaderType,
} from "~/lib/services/shared/type";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";
import { fetcher } from "~/lib/utils";

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SemesterLoaderType<NilaiSemesterData>> {
  const { searchParams } = new URL(request.url);
  const session = await getSession(request.headers.get("Cookie"));
  const { semester, year } = getCurrentYearAndSemester({
    searchParams,
    session,
  });
  searchParams.set("semester", semester.toString());
  searchParams.set("year", year.toString());

  const res = await fetcher({
    url: "academic/nilai",
    options: {
      method: "GET",
      headers: { Cookie: serializeCookies(session.data) },
    },
    searchParams,
  });

  const json = (await res.json()) as ApiResponse<NilaiSemesterData>;

  if (!res.ok || json.message || !json.data) {
    if (res.status === 401) {
      const session = await getSession(request.headers.get("cookie"));
      throw redirectDocument("/login", {
        headers: { "Set-Cookie": await destroySession(session) },
      });
    }

    return { error: json.message ?? "Terjadi kesalahan" };
  }

  return { success: { data: json.data, semester, year } };
}

const columns: ColumnDef<NilaiSemesterData["table"][0]>[] = [
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

export default function NilaiSemesterPage({
  loaderData,
}: Route.ComponentProps) {
  if (loaderData.error || !loaderData.success) {
    return (
      <p className="text-center text-destructive text-lg">{loaderData.error}</p>
    );
  }
  const { data, semester, year } = loaderData.success;

  return (
    <div className="space-y-6">
      <TableYearSemester
        list={{ semester: data.semester, year: data.year }}
        defaultValue={{ semester, year }}
      />

      <DataTable columns={columns} data={data.table} />
    </div>
  );
}
