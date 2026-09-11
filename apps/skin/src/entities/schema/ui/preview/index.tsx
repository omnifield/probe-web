import { Typography } from "@web-core/ui";

import type { Schema } from "../../model";

export interface SchemaPreviewProps {
  readonly schema: Schema;
}

export function SchemaPreview(props: SchemaPreviewProps) {
  return <Typography as="pre">{JSON.stringify(props.schema, null, 2)}</Typography>;
}
