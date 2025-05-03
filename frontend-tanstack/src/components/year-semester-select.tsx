import { semesterData } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function TableYearSemester({
  list,
  defaultValue: selected,
  onValueChange,
  children,
}: {
  list: { year: number[]; semester: number[] };
  defaultValue: { year: number; semester: number };
  onValueChange?: {
    year: (val: number) => void;
    semester: (val: number) => void;
  };
  children?: React.ReactNode;
}) {
  return (
    <table>
      <tbody className="text-sm sm:text-base">
        <tr>
          <td className="p-2">Tahun Ajaran</td>
          <td className="p-2">
            <Select
              defaultValue={selected.year.toString()}
              onValueChange={(val) => onValueChange?.year(parseInt(val))}
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
              onValueChange={(val) => onValueChange?.semester(parseInt(val))}
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
