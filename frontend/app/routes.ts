import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  route("logout", "routes/guest/logout.tsx"),
  layout("routes/guest/guest-layout.tsx", [
    route("login", "routes/guest/login.tsx"),
  ]),

  layout("routes/user/user-layout.tsx", [
    index("routes/user/home.tsx"),

    route("under-construction", "routes/user/construction.tsx"),
    ...prefix("academic", [
      route("frs-online-mbkm", "routes/user/academic/frs-online-mbkm.tsx"),
      route("nilai-semester", "routes/user/academic/nilai-semester.tsx"),
      route("absen", "routes/user/academic/absen.tsx"),
      route("jadwal-kuliah", "routes/user/academic/jadwal-kuliah.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
