import type { z } from "@web-core/io";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const HTTP_METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export interface OpenapiEndpoint {
  readonly method: HttpMethod;
  readonly url: string;
  readonly tag?: string;
  /** Параметры (query/path) — по имени, плюс `body`, если у операции есть тело — одна схема на
   *  ручку, рендерится тем же `Node`/`Leaf`, что и мод 1. */
  readonly schema: z.ZodType;
}
