// import { DevTool } from "@hookform/devtools";
import { DataTable } from "@/components/ui/data-table";
import TableYearSemester from "@/components/year-semester-select";
import { queryApi } from "@/lib/api";
import type { paths } from "@/openapi/openapi-schema";
import { yearSemesterSchema } from "@/schema/year-semester-schema";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { zodValidator } from "@tanstack/zod-adapter";
import { Suspense } from "react";
import { z } from "zod";
import { parseSessionData } from "@/lib/session-parser";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button, SubmitButton } from "@/components/ui/button";
import {
  Check,
  ChevronsUpDown,
  File,
  FileImage,
  Printer,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale/id";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { TimePicker } from "@/components/ui/time-picker";
import { Separator } from "@/components/ui/separator";

export const logbookSearchParamsSchema = yearSemesterSchema.extend({
  week: z
    .number()
    .min(1)
    .max(24)
    .catch(() => parseSessionData()!.week),
});

export const Route = createFileRoute("/_user/academic/logbook")({
  component: RouteComponent,
  validateSearch: zodValidator(logbookSearchParamsSchema),
  loaderDeps: ({ search: { semester, year, week } }) => ({
    semester,
    year,
    week,
  }),
  loader: ({
    context: { queryClient },
    deps: { semester, year, week: minggu },
    abortController,
  }) => {
    queryClient.prefetchQuery(
      queryApi.queryOptions("get", "/api/v1/academic/logbook", {
        params: { query: { semester, year, minggu } },
        signal: abortController.signal,
      })
    );
  },
});

type LogbookResponse =
  paths["/api/v1/academic/logbook"]["get"]["responses"]["200"]["content"]["application/json"];

const columns: ColumnDef<LogbookResponse["data"]["table"][number]>[] = [
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
    meta: {
      headerClassName: "w-4 whitespace-normal py-4",
    },
  },
  {
    accessorKey: "tanggal",
    header: "Tanggal",
    cell: ({ row }) => <p className="text-center">{row.original.tanggal}</p>,
    meta: {
      headerClassName: "w-14 whitespace-normal",
      cellClassName: "whitespace-normal",
    },
  },
  {
    accessorKey: "jamMulai",
    header: "Jam Mulai",
    cell: ({ row }) => <p className=" text-center">{row.original.jamMulai}</p>,
    meta: {
      headerClassName: "w-14 whitespace-normal",
      cellClassName: "whitespace-normal",
    },
  },
  {
    accessorKey: "jamSelesai",
    header: "Jam Selesai",
    cell: ({ row }) => <p className="text-center">{row.original.jamSelesai}</p>,
    meta: {
      headerClassName: "w-14 whitespace-normal",
      cellClassName: "whitespace-normal",
    },
  },
  {
    accessorKey: "kegiatan",
    header: "Kegiatan",
    cell: ({ row }) => <p className="text-left">{row.original.kegiatan}</p>,
    meta: {
      headerClassName: "min-w-72",
      cellClassName: "whitespace-normal",
    },
  },
  {
    accessorKey: "matkulKegiatan",
    header: "Matakuliah Sesuai Kegiatan",
    cell: ({ row }) => (
      <p className="text-center">{row.original.matkulKegiatan}</p>
    ),
    meta: {
      headerClassName: "w-32 whitespace-normal",
      cellClassName: "whitespace-normal",
    },
  },
  {
    accessorKey: "fileProgres",
    header: "File Progres",
    cell: ({ row }) =>
      row.original.fileProgres && (
        <Button type="button" variant="outline" asChild>
          <a
            href={`https://online.mis.pens.ac.id/${row.original.fileProgres}`}
            target="_blank"
          >
            <File />
          </a>
        </Button>
      ),
    meta: {
      headerClassName: "w-14 whitespace-normal",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "fileFoto",
    header: "File Foto",
    cell: ({ row }) => (
      <Button type="button" variant="outline" asChild>
        <a
          href={`https://online.mis.pens.ac.id/${row.original.fileFoto}`}
          target="_blank"
        >
          <FileImage />
        </a>
      </Button>
    ),
    meta: {
      headerClassName: "w-14 whitespace-normal",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "linkCetak",
    header: "Cetak",
    cell: ({ row }) => (
      <Button type="button" variant="outline" asChild>
        <a
          href={`https://online.mis.pens.ac.id/${row.original.linkCetak}`}
          target="_blank"
        >
          <Printer />
        </a>
      </Button>
    ),
    meta: {
      headerClassName: "w-14 whitespace-normal",
      cellClassName: "text-center",
    },
  },
  {
    accessorKey: "linkHapus",
    header: "Hapus",
    cell: ({ row }) => {
      const searchParams = Route.useSearch();
      const queryClient = useQueryClient();
      const { mutate, isPending } = queryApi.useMutation(
        "delete",
        "/api/v1/academic/logbook/{id}",
        {
          onSuccess: () => {
            queryClient.invalidateQueries(
              queryApi.queryOptions("get", "/api/v1/academic/logbook", {
                params: {
                  query: {
                    semester: searchParams.semester,
                    year: searchParams.year,
                    minggu: searchParams.week,
                  },
                },
              })
            );
          },
        }
      );
      return (
        row.original.deletable && (
          <SubmitButton
            isLoading={isPending}
            variant="destructive"
            type="button"
            onClick={() => {
              mutate({
                params: { path: { id: row.original.id } },
                body: {
                  minggu: searchParams.week,
                  semester: searchParams.semester,
                  tahun: searchParams.year,
                },
              });
            }}
          >
            <Trash2 />
          </SubmitButton>
        )
      );
    },
    meta: {
      headerClassName: "w-14 whitespace-normal",
      cellClassName: "text-center",
    },
  },
];

const forbiddenKeywords = ["update", "delete", "insert", "create", "select"];

const logbookCreateSchema = z
  .object({
    jamMulai: z.date(),
    jamSelesai: z.date(),
    kegiatan: z
      .string()
      .min(1)
      .max(4000)
      .superRefine((val, ctx) => {
        const hasForbiddenKeyword = forbiddenKeywords.some((keyword) =>
          val.toLowerCase().includes(keyword)
        );
        if (hasForbiddenKeyword) {
          return ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Kegiatan tidak boleh mengandung kata: ${forbiddenKeywords
              .join(", ")
              .toUpperCase()}`,
          });
        }
      }),
    sesuaiKuliah: z.boolean(),
    matakuliah: z.number().optional(),
  })
  .superRefine(({ sesuaiKuliah, matakuliah }, ctx) => {
    if (sesuaiKuliah && matakuliah == undefined) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Matakuliah harus dipilih jika sesuai kuliah dicentang",
        path: ["matakuliah"],
      });
    }
  });

function RouteContent() {
  const searchParams = Route.useSearch();
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const {
    data: {
      data: {
        semester,
        year,
        table,
        minggu,
        formDetail,
        kpDaftar,
        mahasiswa,
        catatanDosen,
        catatanPerusahaan,
      },
    },
  } = queryApi.useSuspenseQuery("get", "/api/v1/academic/logbook", {
    params: {
      query: {
        semester: searchParams.semester,
        year: searchParams.year,
        minggu: searchParams.week,
      },
    },
  });

  const { mutate, isPending } = queryApi.useMutation(
    "post",
    "/api/v1/academic/logbook",
    {
      onSuccess: () => {
        queryClient.invalidateQueries(
          queryApi.queryOptions("get", "/api/v1/academic/logbook", {
            params: {
              query: {
                semester: searchParams.semester,
                year: searchParams.year,
                minggu: searchParams.week,
              },
            },
          })
        );
      },
    }
  );

  const form = useForm<z.infer<typeof logbookCreateSchema>>({
    resolver: zodResolver(logbookCreateSchema),
    defaultValues: {
      sesuaiKuliah: false,
      kegiatan: "",
      matakuliah: undefined,
    },
  });

  const onSubmit = (value: z.infer<typeof logbookCreateSchema>) => {
    const sessionData = parseSessionData();
    if (!sessionData) return;
    const { semester, week, year } = sessionData;

    mutate({
      body: {
        kpDaftar,
        mahasiswa,
        jamMulai: format(value.jamMulai, "HH:mm"),
        jamSelesai: format(value.jamSelesai, "HH:mm"),
        kegiatan: value.kegiatan,
        sesuaiKuliah: value.sesuaiKuliah,
        matakuliah: value.matakuliah,
        minggu: week,
        semester,
        tahun: year,
        tanggal: format(new Date(), "yyyy-MM-dd"),
      },
    });
  };

  const [sesuaiKuliah] = form.watch(["sesuaiKuliah"]);

  return (
    <div className="space-y-6">
      <TableYearSemester
        list={{ semester, year }}
        defaultValue={{
          semester: searchParams.semester,
          year: searchParams.year,
        }}
        onValueChange={{
          semester: (val) => {
            navigate({
              search: (prev) => ({ ...prev, semester: val }),
              replace: true,
            });
          },
          year: (val) => {
            navigate({
              search: (prev) => ({ ...prev, year: val }),
              replace: true,
            });
          },
        }}
      >
        <tr>
          <td className="p-2">Minggu</td>
          <td className="p-2">
            <Select
              defaultValue={searchParams.week.toString()}
              onValueChange={(val) => {
                navigate({
                  search: (prev) => ({ ...prev, week: parseInt(val) }),
                  replace: true,
                });
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {minggu.map((val) => (
                    <SelectItem value={val.toString()} key={val}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </td>
        </tr>
      </TableYearSemester>
      <div className="rounded-md border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Table>
              <TableBody>
                {/* BIODATA MAHASISWA SECTION */}
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold text-base">
                    A. BIODATA MAHASISWA
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">Nama</TableCell>
                  <TableCell className="w-3/4">{formDetail.nama}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">NRP</TableCell>
                  <TableCell className="w-3/4">{formDetail.nrp}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">
                    Pembimbing
                  </TableCell>
                  <TableCell className="w-3/4">
                    {formDetail.pembimbing}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">Tempat KP</TableCell>
                  <TableCell className="w-3/4">{formDetail.tempatKp}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">
                    Tanggal KP
                  </TableCell>
                  <TableCell className="w-3/4">
                    {formDetail.tanggalKp}
                  </TableCell>
                </TableRow>

                {/* LOGBOOK KEGIATAN HARIAN SECTION */}
                <TableRow>
                  <TableCell colSpan={2} className="font-semibold text-base">
                    B. LOGBOOK KEGIATAN HARIAN
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">Tanggal</TableCell>
                  <TableCell className="w-3/4">
                    {format(new Date(), "dd MMMM yyyy", {
                      locale: id,
                    })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">Jam Mulai</TableCell>
                  <TableCell className="w-3/4">
                    <FormField
                      control={form.control}
                      name="jamMulai"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <TimePicker
                                date={field.value}
                                onDateChange={field.onChange}
                              />
                              NOTE: Format = jj:mm, contoh 08:00
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">
                    Jam Selesai
                  </TableCell>
                  <TableCell className="w-3/4">
                    <FormField
                      control={form.control}
                      name="jamSelesai"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <TimePicker
                                date={field.value}
                                onDateChange={field.onChange}
                              />
                              NOTE: Format = jj:mm, contoh 16:00
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-1/4 font-medium">
                    Kegiatan/Materi
                  </TableCell>
                  <TableCell className="w-3/4">
                    <FormField
                      control={form.control}
                      name="kegiatan"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">
                    <FormField
                      control={form.control}
                      name="sesuaiKuliah"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex gap-2 items-center">
                              <Checkbox
                                id="sesuai"
                                className="size-5"
                                checked={field.value}
                                onCheckedChange={(val) => {
                                  const checked = val.valueOf();
                                  field.onChange(!!checked);
                                }}
                              />
                              <label htmlFor="sesuai">
                                Materi yang didapat sesuai dengan mata kuliah
                                yang diajarkan
                              </label>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
                {sesuaiKuliah && (
                  <TableRow>
                    <TableCell className="w-1/4 font-medium">
                      Pilih Matakuliah
                    </TableCell>
                    <TableCell className="w-3/4">
                      <FormField
                        control={form.control}
                        name="matakuliah"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {formDetail.listMatkul.find(
                                      (e) => e.value === field.value
                                    )?.text ?? "Pilih matakuliah..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="start"
                                  className="w-full min-w-[var(--radix-popper-anchor-width)] p-0"
                                >
                                  <Command
                                    filter={(value, search, keywords = []) => {
                                      const extendValue =
                                        value + " " + keywords.join(" ");
                                      if (
                                        extendValue
                                          .toLowerCase()
                                          .includes(search.toLowerCase())
                                      ) {
                                        return 1;
                                      }
                                      return 0;
                                    }}
                                  >
                                    <CommandInput placeholder="Search..." />
                                    <CommandList>
                                      <CommandEmpty>
                                        Matakuliah tidak ditemukan
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {formDetail.listMatkul.map(
                                          ({ text, value }) => (
                                            <CommandItem
                                              key={value}
                                              value={value.toString()}
                                              keywords={[text]}
                                              onSelect={(currentValue) => {
                                                form.setValue(
                                                  "matakuliah",
                                                  parseInt(currentValue)
                                                );
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  field.value === value
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                )}
                                              />
                                              {text}
                                            </CommandItem>
                                          )
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell colSpan={2}>
                    <div className="flex justify-end">
                      <SubmitButton isLoading={isPending}>Save</SubmitButton>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </form>
        </Form>
      </div>
      <Separator />
      <div className="space-y-3">
        <table>
          <tbody className="text-sm sm:text-base">
            <tr>
              <td className="p-2 w-1/4">
                Catatan Pembimbing PENS pada minggu ke-{searchParams.week}
              </td>
              <td className="p-2 w-3/4">{catatanDosen}</td>
            </tr>
            <tr>
              <td className="p-2 w-1/4">
                Catatan Pembimbing Perusahaan pada minggu ke-{searchParams.week}
              </td>
              <td className="p-2 w-3/4">{catatanPerusahaan}</td>
            </tr>
          </tbody>
        </table>
        <DataTable columns={columns} data={table} />
      </div>
    </div>
  );
}

function RouteComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouteContent />
    </Suspense>
  );
}
