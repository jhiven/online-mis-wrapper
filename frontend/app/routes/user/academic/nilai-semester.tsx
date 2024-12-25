import type { Route } from "./+types/nilai-semester";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import TableYearSemester from "~/components/year-semester-select";
import { NilaiSemesterService } from "~/lib/services/academic/nilai-semester";
import type { NilaiSemesterData } from "~/lib/services/academic/nilai-semester/type";
import { OnlineMisServiceHandler } from "~/lib/services/shared/handler";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const { semester, year } = getCurrentYearAndSemester({ searchParams });

  const service = new NilaiSemesterService();
  const handler = new OnlineMisServiceHandler(service);
  const data = await handler.run(request, {
    year,
    semester,
  });

  return { data, semester, year };
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
  loaderData: { data, semester, year },
}: Route.ComponentProps) {
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
