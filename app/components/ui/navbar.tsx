import { Avatar, AvatarFallback } from "./avatar";
import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { ChevronRight, LogOut, MenuIcon } from "lucide-react";
import React from "react";
import { Link, type LinkProps, useFetcher } from "react-router";
import { cn } from "~/lib/utils";

const academic: { title: string; href: string }[] = [
  {
    title: "FRS Online MBKM",
    href: "/academic/frs-online-mbkm",
  },
  {
    title: "FRS Semester Antara",
    href: "",
  },
  {
    title: "Nilai per Semester",
    href: "/academic/nilai-semester",
  },
  {
    title: "Absen",
    href: "/academic/absen",
  },
  {
    title: "Jadwal Kuliah",
    href: "/academic/jadwal-kuliah",
  },
  {
    title: "Pengajuan Pendaftaran MBKM",
    href: "",
  },
  {
    title: "Pengajuan Tempat KP",
    href: "",
  },
  {
    title: "Entry Logbook KP",
    href: "",
  },
  {
    title: "Revisi sidang KP",
    href: "",
  },
  {
    title: "Pengajuan judul PA",
    href: "",
  },
  {
    title: "Entry Logbook SPPA,PPA,PA",
    href: "",
  },
  {
    title: "Revisi Sidang SPPA,PPA,PA",
    href: "",
  },
  {
    title: "Revisi Sidang Tesis",
    href: "",
  },
  {
    title: "Verifikasi Data Wisuda",
    href: "",
  },
  {
    title: "Lembar Pengesahan KP",
    href: "",
  },
  {
    title: "Lembar Pengesahan PA/Tesis",
    href: "",
  },
];

const nonAcademic: { title: string; href: string }[] = [
  {
    title: "Kuisioner Zona Integritas",
    href: "",
  },
  {
    title: "Kuisioner Kepuasan Layanan",
    href: "",
  },
  {
    title: "Kuisioner Teori",
    href: "",
  },
  {
    title: "Kuisioner Praktikum",
    href: "",
  },
  {
    title: "Entry Pengaduan",
    href: "",
  },
];

export default function Navbar({ user }: { user: string }) {
  const fetcher = useFetcher();

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between xl:px-0 px-4">
        <Link
          to="https://pens.ac.id"
          target="_blank"
          className="flex items-center gap-2"
        >
          <img src="/logo_pens.png" className="size-10" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/" className={navigationMenuTriggerStyle()}>
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
                        to={component.href}
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
                        to={component.href}
                      />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/under-construction"
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
                  fetcher.submit({}, { action: "/logout", method: "post" });
                }}
              >
                <LogOut />
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
              <MobileListItem title="Home" to="/" />
              <MobileCollapsibleIem data={academic} title="Akademik" />
              <MobileCollapsibleIem data={nonAcademic} title="Non Akademik" />
              <MobileListItem title="Daftar Ulang" to="/under-construction" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<React.ComponentRef<"a">, LinkProps>(
  ({ className, title, children, to, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            to={to || "/under-construction"}
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
);

ListItem.displayName = "ListItem";

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
      <CollapsibleContent className="text-foreground transition-all duration-700 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 flex flex-col data-[state=open]:py-2">
        {data.map(({ href, title }) => (
          <SheetClose asChild key={title}>
            <Link
              to={href || "/under-construction"}
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

function MobileListItem({ title, ...props }: LinkProps) {
  return (
    <SheetClose asChild>
      <Link
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
