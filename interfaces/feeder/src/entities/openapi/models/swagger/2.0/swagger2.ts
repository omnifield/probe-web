import type { MappingTemplate } from "@web-core/generators/mapping";
import { z } from "@web-core/io";
import { parse } from "yaml";

import { schemaNodeToZod, type SchemaNode } from "./json-schema-to-zod.js";
import { HTTP_METHODS, type HttpMethod, type OpenapiEndpoint } from "../../index.js";

interface Swagger2Parameter {
  readonly name: string;
  readonly in: "query" | "path" | "header" | "body" | "formData";
  readonly required?: boolean;
  readonly type?: string;
  readonly items?: SchemaNode;
  readonly enum?: readonly unknown[];
  /** Только у `in: "body"` — тело параметра описано отдельной JSON-Schema-подобной схемой. */
  readonly schema?: SchemaNode;
}

interface Swagger2Operation {
  readonly tags?: readonly string[];
  readonly parameters?: readonly Swagger2Parameter[];
}

// Swagger 2.0 — `yaml`'s parse() читает JSON тоже (JSON — валидный YAML 1.2), одного парсера
// достаточно на оба формата файла, юзер может принести что угодно из двух.
interface Swagger2Document {
  readonly swagger?: string;
  readonly host?: string;
  readonly basePath?: string;
  readonly schemes?: readonly string[];
  readonly paths?: Readonly<Record<string, Readonly<Record<string, Swagger2Operation>>>>;
  readonly definitions?: Readonly<Record<string, SchemaNode>>;
}

function parseSwagger2(raw: string): Swagger2Document | undefined {
  try {
    const doc: unknown = parse(raw);
    return typeof doc === "object" && doc !== null && (doc as Swagger2Document).swagger === "2.0"
      ? (doc as Swagger2Document)
      : undefined;
  } catch {
    return undefined;
  }
}

function baseUrlOf(doc: Swagger2Document): string {
  const scheme = doc.schemes?.[0] ?? "https";
  return `${scheme}://${doc.host ?? ""}${doc.basePath ?? ""}`;
}

// header/formData — не в первой версии: header почти всегда служебный (авторизация), formData
// требует multipart-обвязки, которой мод 2 сегодня не занимается (см. ROADMAP.yaml).
function fieldsOfOperation(
  operation: Swagger2Operation,
  definitions: Readonly<Record<string, SchemaNode>>,
): z.ZodType {
  const shape: Record<string, z.ZodType> = {};

  for (const param of operation.parameters ?? []) {
    if (param.in === "header" || param.in === "formData") continue;

    const key = param.in === "body" ? "body" : param.name;
    const value =
      param.schema !== undefined
        ? schemaNodeToZod(param.schema, definitions)
        : scalarParamToZod(param, definitions);

    shape[key] = param.required === true ? value : value.optional();
  }

  return z.object(shape);
}

function scalarParamToZod(param: Swagger2Parameter, definitions: Readonly<Record<string, SchemaNode>>): z.ZodType {
  if (param.enum !== undefined && param.enum.length > 0 && param.enum.every((value) => typeof value === "string")) {
    return z.enum(param.enum as [string, ...string[]]);
  }

  switch (param.type) {
    case "integer":
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "array":
      return z.array(param.items ? schemaNodeToZod(param.items, definitions) : z.unknown());
    default:
      return z.string();
  }
}

// Только методы, которые понимает движок (`HTTP_METHODS`) — HEAD/OPTIONS и что угодно ещё
// у Swagger'а молча пропускаются: форма ручки такие методы не поддерживает вообще.
export const swagger2Template: MappingTemplate<OpenapiEndpoint, readonly OpenapiEndpoint[]> = {
  name: "swagger-2.0",

  isEntry: (raw) => parseSwagger2(raw) !== undefined,

  collect: (raw) => {
    const doc = parseSwagger2(raw);
    if (doc === undefined) return [];

    const baseUrl = baseUrlOf(doc);
    const definitions = doc.definitions ?? {};
    const items: OpenapiEndpoint[] = [];

    for (const [path, operations] of Object.entries(doc.paths ?? {})) {
      for (const [method, operation] of Object.entries(operations)) {
        const upperMethod = method.toUpperCase();
        if (!HTTP_METHODS.includes(upperMethod as HttpMethod)) continue;

        items.push({
          method: upperMethod as HttpMethod,
          url: `${baseUrl}${path}`,
          tag: operation.tags?.[0],
          schema: fieldsOfOperation(operation, definitions),
        });
      }
    }

    return items;
  },

  validate: (items) => {
    if (items.length === 0) throw new Error("swagger-2.0: в paths не нашлось ни одной операции с поддерживаемым методом");
  },

  render: (items) => items,
};
