import type { Route } from "./+types/absen";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "~/components/ui/data-table";
import TableYearSemester from "~/components/year-semester-select";
import { AbsenService } from "~/lib/services/academic/absen";
import type { AbsenData } from "~/lib/services/academic/absen/type";
import { OnlineMisServiceHandler } from "~/lib/services/shared/handler";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const { semester, year } = getCurrentYearAndSemester({ searchParams });

  const service = new AbsenService();
  const handler = new OnlineMisServiceHandler(service);
  const data = await handler.run(request, {
    year,
    semester,
  });

  return { data, semester, year };
}

const columns: ColumnDef<AbsenData["table"][0]>[] = [
  {
    accessorKey: "kode",
    header: "Kode MK",
    cell: ({ row }) => <p className="text-center">{row.original.kode}</p>,
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
      })),
  },
  {
    accessorKey: "kehadiran",
    header: "Kehadiran",
    cell: ({ row }) => <p className="text-center">{row.original.kehadiran}</p>,
  },
];

export default function AbsenPage({
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
