import type { Route } from "./+types/jadwal-kuliah";
import { redirectDocument } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import TableYearSemester from "~/components/year-semester-select";
import { destroySession, getSession, serializeCookies } from "~/lib/cookie";
import type { JadwalKuliahData } from "~/lib/services/academic/jadwal-kuliah/type";
import type {
  ApiResponse,
  SemesterLoaderType,
} from "~/lib/services/shared/type";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";
import { fetcher } from "~/lib/utils";

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SemesterLoaderType<JadwalKuliahData>> {
  const { searchParams } = new URL(request.url);
  const session = await getSession(request.headers.get("Cookie"));
  const { semester, year } = getCurrentYearAndSemester({ searchParams });
  searchParams.set("semester", semester.toString());
  searchParams.set("year", year.toString());

  const res = await fetcher({
    url: "academic/jadwal",
    options: {
      method: "GET",
      headers: { Cookie: serializeCookies(session.data) },
    },
    searchParams,
  });

  const json = (await res.json()) as ApiResponse<JadwalKuliahData>;

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

export default function JadwalKuliah({ loaderData }: Route.ComponentProps) {
  if (loaderData.error || !loaderData.success) {
    return (
      <p className="text-center text-destructive text-lg">{loaderData.error}</p>
    );
  }
  const { data, semester, year } = loaderData.success;

  const isTableEmpty = Object.values(data.table).every((v) => v.length === 0);

  return (
    <div className="space-y-6">
      <TableYearSemester
        list={{ semester: data.semester, year: data.year }}
        defaultValue={{ semester, year }}
      />

      <div className="space-y-2">
        <div className="flex justify-between flex-wrap text-sm sm:text-base">
          <p>{data.jamIstirahat}</p>
          <p>
            Kelas: <span className="font-medium">{data.kelas}</span>
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
                Object.entries(data.table).map(([hari, jadwal]) =>
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
