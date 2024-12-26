import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useSearchParams } from "react-router";
import { semesterData } from "~/lib/utils";

export default function TableYearSemester({
  list,
  defaultValue: selected,
  children,
}: {
  list: { year: number[]; semester: number[] };
  defaultValue: { year: number; semester: number };
  children?: React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <table>
      <tbody className="text-sm sm:text-base">
        <tr>
          <td className="p-2">Tahun Ajaran</td>
          <td className="p-2">
            <Select
              defaultValue={selected.year.toString()}
              onValueChange={(val) =>
                setSearchParams((prev) => {
                  const params = new URLSearchParams(prev);
                  params.set("year", val);
                  return params;
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih tahun ajaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {list.year.map((tahun) => (
                    <SelectItem value={tahun.toString()} key={tahun}>
                      {tahun} / {tahun + 1}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </td>
        </tr>
        <tr>
          <td className="p-2">Semester</td>
          <td className="p-2">
            <Select
              defaultValue={selected.semester.toString()}
              onValueChange={(val) =>
                setSearchParams((prev) => {
                  const params = new URLSearchParams(prev);
                  params.set("semester", val);
                  return params;
                })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {list.semester.map((sem) => (
                    <SelectItem value={sem.toString()} key={sem}>
                      {semesterData[sem]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </td>
        </tr>
        {children}
      </tbody>
    </table>
  );
}
