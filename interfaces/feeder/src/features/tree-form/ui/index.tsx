import type { z } from "@web-core/io";

import { Tree } from "../../../entities/form/ui";

export function TreeForm(props: {
  schema: z.ZodType;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return <Tree {...props} />;
}
