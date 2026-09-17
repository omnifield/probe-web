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

/** Один параметр вручную заведённой ручки (группа-юзер) — своя, урезанная версия того, что у
 *  свагера несёт `Swagger2Parameter`: без `in` (query/path определяется по тому, встречается ли
 *  имя в `{плейсхолдере}` url — та же логика, что уже применяет `invokeEndpoint`), без `enum`/
 *  вложенных объектов — только то, что реально нужно было в кейсе (см. FAQ.md). */
export interface EndpointParam {
  readonly name: string;
  readonly type: "string" | "number" | "boolean";
  readonly required: boolean;
}

/** Схема A — «как настроить ручку», заполняется юзером вручную через `Tree` (мод 1), не
 *  распознаётся из чужого документа. Один дескриптор → один `OpenapiEndpoint` через
 *  `descriptorToEndpoint`. */
export interface EndpointDescriptor {
  readonly method: HttpMethod;
  readonly url: string;
  readonly params: readonly EndpointParam[];
}
