import { z } from "@web-core/io";

import { HTTP_METHODS, type EndpointDescriptor, type EndpointParam, type HttpMethod, type OpenapiEndpoint } from "./types.js";

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

function paramTypeToZod(type: EndpointParam["type"]): z.ZodType {
  switch (type) {
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    default:
      return z.string();
  }
}

/** Превращает вручную заполненный дескриптор в тот же `OpenapiEndpoint`, что и распознавание
 *  свагера — дальше по пайплайну (карточка, вызов) разницы в происхождении уже нет. */
export function descriptorToEndpoint(descriptor: EndpointDescriptor): OpenapiEndpoint {
  const shape: Record<string, z.ZodType> = {};
  for (const param of descriptor.params) {
    const value = paramTypeToZod(param.type);
    shape[param.name] = param.required ? value : value.optional();
  }

  return { method: descriptor.method, url: descriptor.url, schema: z.object(shape) };
}
