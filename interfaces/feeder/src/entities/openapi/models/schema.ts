import { z } from "@web-core/io";

import { HTTP_METHODS, type EndpointDescriptor, type HttpMethod } from "./types.js";

const paramSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  required: z.boolean(),
});

/** Схема ОДНОГО дескриптора — рендерится `Tree` как один элемент списка (аккордеон), `params`
 *  внутри — вложенный список того же рода (та же машинерия `Node`/`Box`, что и любой `list`-field
 *  мода 1, глубина не ограничена архитектурно). */
export const endpointDescriptorSchema: z.ZodType = z.object({
  method: z.enum(HTTP_METHODS as [HttpMethod, ...HttpMethod[]]),
  url: z.string(),
  params: z.array(paramSchema),
});

/** `Tree` рендерит только объектный корень (`fieldsOf` не рисует ничего для схемы-массива верхнего
 *  уровня) — обёртка в один ключ нужна ровно поэтому, не несёт своего смысла. */
export const manualGroupSchema: z.ZodType = z.object({ endpoints: z.array(endpointDescriptorSchema) });

export interface ManualGroupValue {
  readonly endpoints: readonly EndpointDescriptor[];
}
