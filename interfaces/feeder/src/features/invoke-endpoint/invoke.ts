import type { OpenapiEndpoint } from "../../entities/openapi/index.js";
import { HTTPError, rawRestRequest } from "@web-core/query/rest";

export interface InvokeResult {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

function toResult(response: Response, body: unknown): InvokeResult {
  return {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  };
}

/** `{petId}` в шаблоне url — путь, остальные ключи (кроме `body`) — query. Шаблон свагера сам
 *  несёт эту разницу именем плейсхолдера, отдельно её нести в схеме не нужно. */
function resolveUrl(template: string, params: Readonly<Record<string, unknown>>): { url: string; query: Record<string, unknown> } {
  let url = template;
  const query: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{${key}}`;
    if (url.includes(placeholder)) url = url.replaceAll(placeholder, encodeURIComponent(String(value)));
    else query[key] = value;
  }

  return { url, query };
}

function appendQuery(url: string, query: Readonly<Record<string, unknown>>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) search.append(key, String(item));
  }
  const serialized = search.toString();
  return serialized === "" ? url : `${url}?${serialized}`;
}

/** Выполняет ручку по-настоящему (`@web-core/query/rest`) с уже настроенными параметрами —
 *  `value` формы `{ [queryOrPathParam]: unknown, body?: unknown }`, той же формы, что схема
 *  ручки из `entities/openapi`. Постман-путь: не-2xx — валидный результат для показа, не
 *  исключение (`HTTPError` ловится и разбирается в тот же `InvokeResult`, что и успех). */
export async function invokeEndpoint(endpoint: OpenapiEndpoint, value: unknown): Promise<InvokeResult> {
  const params = (typeof value === "object" && value !== null ? value : {}) as Record<string, unknown>;
  const { body, ...rest } = params;
  const { url: pathResolved, query } = resolveUrl(endpoint.url, rest);
  const url = appendQuery(pathResolved, query);

  try {
    const { response, data } = await rawRestRequest(url, { method: endpoint.method, json: body });
    return toResult(response, data);
  } catch (error) {
    if (error instanceof HTTPError) return toResult(error.response, error.data);
    throw error;
  }
}
