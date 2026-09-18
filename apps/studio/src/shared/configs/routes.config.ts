import { index, layout, rootRoute, route } from "@web-core/router/virtual-file-routes";

export default rootRoute("__root.tsx", [
  layout("workspace", "../pages/route.tsx", [
    route("/playground", "../pages/playground/route.tsx"),
    route("/lab/{-$component}", "../pages/lab/route.tsx", [
      route("/{-$feature}", "../pages/lab/kitchen/route.tsx"),
    ]),
    route("/showcase/{-$component}", "../pages/showcase/route.tsx", [
      index("../pages/showcase/component/route.tsx"),
    ]),
  ]),
  route("/embed/$component/$assembly", "../pages/embed/route.tsx"),
]);
