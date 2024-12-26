import type { Route } from "./+types/frs-online-mbkm";
import type { ColumnDef } from "@tanstack/react-table";
import { redirectDocument } from "react-router";
import { DataTable } from "~/components/ui/data-table";
import TableYearSemester from "~/components/year-semester-select";
import { destroySession, getSession, serializeCookies } from "~/lib/cookie";
import type { FRSData } from "~/lib/services/academic/frs-online-mbkm/type";
import type {
  ApiResponse,
  SemesterLoaderType,
} from "~/lib/services/shared/type";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";
import { fetcher, formatDate } from "~/lib/utils";

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SemesterLoaderType<FRSData>> {
  const { searchParams } = new URL(request.url);
  const session = await getSession(request.headers.get("Cookie"));
  const { semester, year } = getCurrentYearAndSemester({ searchParams });
  searchParams.set("semester", semester.toString());
  searchParams.set("year", year.toString());

  const res = await fetcher({
    url: "academic/frs",
    options: {
      method: "GET",
      headers: { Cookie: serializeCookies(session.data) },
    },
    searchParams,
  });

  const json = (await res.json()) as ApiResponse<FRSData>;

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
export default function FRSMbkmPage({ loaderData }: Route.ComponentProps) {
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
      >
        {data.table.length ? (
          <>
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
                  <strong>Drop:</strong>{" "}
                  {formatDate(data.tanggalPenting.drop.from)} -{" "}
                  {formatDate(data.tanggalPenting.drop.to)}
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

      <DataTable columns={columns} data={data.table} />
    </div>
  );
}
