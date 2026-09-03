import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("table").parts(
  "root",
  "caption",
  "head",
  "headRow",
  "headerCell",
  "headerSortTrigger",
  "body",
  "row",
  "cell",
);

export const anatomyParts = anatomy.build();
