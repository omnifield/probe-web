import { fromEnv } from "@web-core/build/env";

const DOCS_LOCAL = "http://localhost:7777/workspaces/UI/pages";

const DOCS_URL = fromEnv("VITE_DOCS_URL") ?? DOCS_LOCAL;

export function docsUrlOf(component: string): string {
  return `${DOCS_URL}/${component}/embed`;
}
