import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  ChevronRight,
  GithubIcon,
  LogOut,
  MenuIcon,
  Trash,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { queryApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

const academic: { title: string; to: LinkProps["to"] }[] = [
  {
    title: "FRS Online MBKM",
    to: "/academic/frs-online-mbkm",
  },
  {
    title: "FRS Semester Antara",
    to: "",
  },
  {
    title: "Nilai per Semester",
    to: "/academic/nilai-semester",
  },
  {
    title: "Absen",
    to: "/academic/absen",
  },
  {
    title: "Jadwal Kuliah",
    to: "/academic/jadwal-kuliah",
  },
  {
    title: "Pengajuan Pendaftaran MBKM",
    to: "",
  },
  {
    title: "Pengajuan Tempat KP",
    to: "",
  },
  {
    title: "Entry Logbook KP",
    to: "/academic/logbook",
  },
  {
    title: "Revisi sidang KP",
    to: "",
  },
  {
    title: "Pengajuan judul PA",
    to: "",
  },
  {
    title: "Entry Logbook SPPA,PPA,PA",
    to: "",
  },
  {
    title: "Revisi Sidang SPPA,PPA,PA",
    to: "",
  },
  {
    title: "Revisi Sidang Tesis",
    to: "",
  },
  {
    title: "Verifikasi Data Wisuda",
    to: "",
  },
  {
    title: "Lembar Pengesahan KP",
    to: "",
  },
  {
    title: "Lembar Pengesahan PA/Tesis",
    to: "",
  },
];

const nonAcademic: { title: string; to: LinkProps["to"] }[] = [
  {
    title: "Kuisioner Zona Integritas",
    to: "",
  },
  {
    title: "Kuisioner Kepuasan Layanan",
    to: "",
  },
  {
    title: "Kuisioner Teori",
    to: "",
  },
  {
    title: "Kuisioner Praktikum",
    to: "",
  },
  {
    title: "Entry Pengaduan",
    to: "",
  },
];

export default function Navbar({ user }: { user: string }) {
  const queryClient = useQueryClient();
  const logoutMutation = queryApi.useMutation("post", "/api/v1/auth/logout", {
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
  const invalidateCacheMutation = queryApi.useMutation(
    "post",
    "/api/v1/invalidate-cache",
    {
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
    }
  );

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between xl:px-0 px-4">
        <Link to="/home" className="flex items-center gap-2">
          <img src="/logo_pens.png" className="size-10" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/home" className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Akademik</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    {academic.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        to={component.to}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Non Akademik</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    {nonAcademic.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        to={component.to}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/construction"
                    className={navigationMenuTriggerStyle()}
                  >
                    Daftar Ulang
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarFallback>{user.slice(0, 2)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuLabel>
                Mahasiswa
                <p className="text-xs font-normal">{user}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  invalidateCacheMutation.mutate({});
                }}
              >
                <Trash />
                Clear Cache
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/jhiven/online-mis-wrapper"
                  target="_blank"
                >
                  <GithubIcon />
                  Source Code
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/80 focus:text-background group"
                onClick={() => {
                  logoutMutation.mutate({});
                }}
              >
                <LogOut className="text-destructive group-focus:text-background" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full md:hidden"
              >
                <MenuIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="md:hidden overflow-y-scroll">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left text-sm flex gap-4 items-center ">
                  <img src="/logo_pens.png" className="size-10" />
                  Online MIS PENS
                </SheetTitle>
              </SheetHeader>
              <MobileListItem title="Home" to="." />
              <MobileCollapsibleIem data={academic} title="Akademik" />
              <MobileCollapsibleIem data={nonAcademic} title="Non Akademik" />
              <MobileListItem title="Daftar Ulang" to="." />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function ListItem({
  className,
  title,
  children,
  to,
  ...props
}: LinkProps & {
  className?: string;
  title: string;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={to || "/construction"}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm flex font-medium leading-none">
            {title} {!to && " 🚧"}
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

function MobileCollapsibleIem({
  data,
  title,
}: {
  data: typeof academic;
  title: string;
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger className="flex text-foreground items-center justify-between select-none text-left w-full rounded-md p-3 leading-none no-underline outline-none transition-colors group data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
        <p>{title}</p>
        <ChevronRight className="size-4 group-data-[state=open]:rotate-90 transition-all" />
      </CollapsibleTrigger>
      <CollapsibleContent className="text-foreground transition-all duration-300 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 flex flex-col data-[state=open]:py-2">
        {data.map(({ to: href, title }) => (
          <SheetClose asChild key={title}>
            <Link
              to={href || "/construction"}
              className={cn(
                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-sm"
              )}
            >
              {title} {!href && " 🚧"}
            </Link>
          </SheetClose>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function MobileListItem({
  title,
  to,
  ...props
}: LinkProps & {
  title: string;
}) {
  return (
    <SheetClose asChild>
      <Link
        to={to || "/construction"}
        className={cn(
          "block select-none text-foreground rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        )}
        {...props}
      >
        {title}
      </Link>
    </SheetClose>
  );
}
