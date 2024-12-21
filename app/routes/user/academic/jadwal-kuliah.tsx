import type { Route } from "./+types/jadwal-kuliah";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import TableYearSemester from "~/components/year-semester-select";
import { JadwalKuliahService } from "~/lib/services/academic/jadwal-kuliah";
import { OnlineMisServiceHandler } from "~/lib/services/shared/handler";
import { getCurrentYearAndSemester } from "~/lib/services/user-metadata";

export async function loader({ request }: Route.LoaderArgs) {
  const { searchParams } = new URL(request.url);
  const { semester, year } = getCurrentYearAndSemester({ searchParams });

  const service = new JadwalKuliahService();
  const handler = new OnlineMisServiceHandler(service);
  const data = await handler.run(request, {
    year,
    semester,
  });

  return { data, semester, year };
}

export default function JadwalKuliah({
  loaderData: { data, semester, year },
}: Route.ComponentProps) {
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
