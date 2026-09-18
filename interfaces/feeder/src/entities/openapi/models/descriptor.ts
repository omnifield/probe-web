import { z } from "@web-core/io";

import type {
  EndpointDescriptor,
  EndpointParam,
  OpenapiEndpoint,
} from "./index.js";

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
export function descriptorToEndpoint(
  descriptor: EndpointDescriptor,
): OpenapiEndpoint {
  const shape: Record<string, z.ZodType> = {};
  for (const param of descriptor.params) {
    const value = paramTypeToZod(param.type);
    shape[param.name] = param.required ? value : value.optional();
  }

  return {
    method: descriptor.method,
    url: descriptor.url,
    schema: z.object(shape),
  };
}
