import { z } from "@omnifield/probe-web-io";
import { fields } from "../../shared/data/fields.js";

export const input = z.object({
  ...fields.labeled,
  helperText: z.string(),
  errorText: z.string(),
});

export const output = z.object({});

export type Data = z.infer<typeof input>;
