// Design notes: ./README.md#rows

import { FIXED_TOKENS } from "@omnifield/probe-web-style";

export const ROWS: readonly string[] = [
  ...FIXED_TOKENS.map((token) => token.name).filter((name) => name !== "control-target-min"),
  "motion-instant",
  "motion-fast",
  "motion-normal",
  "motion-slow",
  "ease-linear",
  "ease-in",
  "ease-out",
  "ease-in-out",
];
