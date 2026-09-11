import type { MappingTemplate } from "@web-core/generators/mapping";
import { parse } from "yaml";

import { HTTP_METHODS, type HttpMethod } from "../endpoint";

// Swagger 2.0 — `yaml`'s parse() читает JSON тоже (JSON — валидный YAML 1.2), одного парсера
// достаточно на оба формата файла, юзер может принести что угодно из двух.
interface Swagger2Document {
  readonly swagger?: string;
  readonly info?: { readonly title?: string };
  readonly host?: string;
  readonly basePath?: string;
  readonly schemes?: readonly string[];
  readonly paths?: Record<string, Record<string, { readonly tags?: readonly string[] }>>;
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

export interface Swagger2EndpointItem {
  readonly serviceName: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly tag?: string;
}

export interface Swagger2Output {
  readonly name: string;
  readonly endpoints: readonly Omit<Swagger2EndpointItem, "serviceName">[];
}

// Только методы, которые понимает наш Endpoint (`HTTP_METHODS`) — HEAD/OPTIONS и что угодно ещё
// у Swagger'а молча пропускаются: наша форма ручки такие методы не поддерживает вообще.
export const swagger2Template: MappingTemplate<Swagger2EndpointItem, Swagger2Output> = {
  name: "swagger-2.0",

  isEntry: (raw) => parseSwagger2(raw) !== undefined,

  collect: (raw) => {
    const doc = parseSwagger2(raw);
    if (doc === undefined) return [];

    const serviceName = doc.info?.title ?? "Без названия";
    const baseUrl = baseUrlOf(doc);
    const items: Swagger2EndpointItem[] = [];

    for (const [path, operations] of Object.entries(doc.paths ?? {})) {
      for (const [method, operation] of Object.entries(operations)) {
        const upperMethod = method.toUpperCase();
        if (!HTTP_METHODS.includes(upperMethod as HttpMethod)) continue;
        items.push({ serviceName, method: upperMethod as HttpMethod, url: `${baseUrl}${path}`, tag: operation.tags?.[0] });
      }
    }

    return items;
  },

  validate: (items) => {
    if (items.length === 0) throw new Error("swagger-2.0: в paths не нашлось ни одной операции с поддерживаемым методом");
  },

  render: (items) => ({
    name: items[0]!.serviceName,
    endpoints: items.map(({ serviceName: _serviceName, ...endpoint }) => endpoint),
  }),
};
