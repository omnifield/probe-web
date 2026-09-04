import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("diagram").parts(
  "root",
  "axis",
  "grid",
  "line",
  "area",
  "bar",
  "point",
);

export const anatomyParts = anatomy.build();
