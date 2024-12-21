import type { Route } from "./+types/frs-online-mbkm";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "~/components/ui/data-table";
import TableYearSemester from "~/components/year-semester-select";
import { FrsOnlineMBKMService } from "~/lib/services/academic/frs-online-mbkm";
import type { FRSData } from "~/lib/services/academic/frs-online-mbkm/type";
import { OnlineMisServiceHandler } from "~/lib/services/shared/handler";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const { semester, year } = getCurrentYearAndSemester({ searchParams });

  const service = new FrsOnlineMBKMService();
  const handler = new OnlineMisServiceHandler(service);
  const data = await handler.run(request, {
    year,
    semester,
  });

  return { data, semester, year };
}

const columns: ColumnDef<FRSData["table"][0]>[] = [
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

export default function FRSMbkmPage({
  loaderData: { data, semester, year },
}: Route.ComponentProps) {
  return (
    <div className="space-y-6">
      <TableYearSemester
        list={{ semester: data.semester, year: data.year }}
        defaultValue={{ semester, year }}
      >
        <tr>
          <td className="p-2 align-top">Dosen Wali</td>
          <td className="p-2 align-top">{data.dosen}</td>
        </tr>
        <tr>
          <td className="p-2 align-top">SKS yang diambil / batas SKS</td>
          <td className="p-2 align-top">
            {data.sks.batas - data.sks.sisa} / {data.sks.batas} SKS
          </td>
        </tr>
        <tr>
          <td className="p-2 align-top">IPK</td>
          <td className="p-2 align-top">{data.ip.ipk}</td>
        </tr>
        <tr>
          <td className="p-2 align-top">IPS Semester Lalu</td>
          <td className="p-2 align-top">{data.ip.ips}</td>
        </tr>
        <tr>
          <td className="p-2 align-top">Tanggal Penting</td>
          <td className="p-2 align-top">
            <div>
              <strong>Pengisian:</strong>{" "}
              {formatDate(data.tanggalPenting.pengisian.from)} -{" "}
              {formatDate(data.tanggalPenting.pengisian.to)}
            </div>
            <div>
              <strong>Perubahan:</strong>{" "}
              {formatDate(data.tanggalPenting.perubahan.from)} -{" "}
              {formatDate(data.tanggalPenting.perubahan.to)}
            </div>
            <div>
              <strong>Drop:</strong> {formatDate(data.tanggalPenting.drop.from)}{" "}
              - {formatDate(data.tanggalPenting.drop.to)}
            </div>
          </td>
        </tr>
      </TableYearSemester>

      <DataTable columns={columns} data={data.table} />
    </div>
  );
}
