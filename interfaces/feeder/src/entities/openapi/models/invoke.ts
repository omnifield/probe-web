export interface InvokeResult {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

export function toResult(response: Response, body: unknown): InvokeResult {
  return {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  };
}

/** `{petId}` в шаблоне url — путь, остальные ключи (кроме `body`) — query. Шаблон свагера сам
 *  несёт эту разницу именем плейсхолдера, отдельно её нести в схеме не нужно. */
export function resolveUrl(template: string, params: Readonly<Record<string, unknown>>): { url: string; query: Record<string, unknown> } {
  let url = template;
  const query: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{${key}}`;
    if (url.includes(placeholder)) url = url.replaceAll(placeholder, encodeURIComponent(String(value)));
    else query[key] = value;
  }

  return { url, query };
}

export function appendQuery(url: string, query: Readonly<Record<string, unknown>>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) search.append(key, String(item));
  }
  const serialized = search.toString();
  return serialized === "" ? url : `${url}?${serialized}`;
}
