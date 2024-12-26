import type { Route } from "./+types/absen";
import { type ColumnDef } from "@tanstack/react-table";
import { redirectDocument } from "react-router";
import { DataTable } from "~/components/ui/data-table";
import TableYearSemester from "~/components/year-semester-select";
import { destroySession, getSession, serializeCookies } from "~/lib/cookie";
import type { AbsenData } from "~/lib/services/academic/absen/type";
import type {
  ApiResponse,
  SemesterLoaderType,
} from "~/lib/services/shared/type";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";
import { fetcher } from "~/lib/utils";

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SemesterLoaderType<AbsenData>> {
  const { searchParams } = new URL(request.url);
  const session = await getSession(request.headers.get("Cookie"));
  const { semester, year } = getCurrentYearAndSemester({ searchParams });
  searchParams.set("semester", semester.toString());
  searchParams.set("year", year.toString());

  const res = await fetcher({
    url: "academic/absen",
    options: {
      method: "GET",
      headers: { Cookie: serializeCookies(session.data) },
    },
    searchParams,
  });

  const json = (await res.json()) as ApiResponse<AbsenData>;

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

export default function AbsenPage({ loaderData }: Route.ComponentProps) {
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
