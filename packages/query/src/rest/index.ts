// Транспорт для обычных REST-эндпоинтов, симметрично `../graphql`: та же роль (queryFn/mutationFn
// для createQuery/createMutation), но без вендора — у HTTP+JSON нет протокольных тонкостей вроде
// сборки {query, variables} и разбора ошибок GraphQL-ответа, которые оправдывали graphql-request
// там. Голого fetch с типизацией и разбором тела хватает, лишний пакет добавлял бы вес без пользы.

export type RestRequestInit = Omit<RequestInit, "body"> & {
  body?: RequestInit["body"];
  /** Сериализуется в JSON и уходит телом; выставляет `content-type: application/json`, если он не задан явно. */
  json?: unknown;
};

export type RestResult<TResult> = {
  readonly response: Response;
  readonly data: TResult;
};

export class HTTPError extends Error {
  readonly response: Response;
  readonly data: unknown;

  constructor(response: Response, data: unknown) {
    super(`HTTP ${response.status} ${response.statusText}`.trim());
    this.name = "HTTPError";
    this.response = response;
    this.data = data;
  }
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.headers.get("content-length") === "0") return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("json") ? response.json() : response.text();
}

async function sendRequest(input: string | URL, init: RestRequestInit): Promise<Response> {
  const { json, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  let body = rest.body;
  if (json !== undefined) {
    body = JSON.stringify(json);
    if (!requestHeaders.has("content-type")) requestHeaders.set("content-type", "application/json");
  }
  return fetch(input, { ...rest, headers: requestHeaders, body });
}

// Внутренности движка — url на каждый вызов, без клиента. Использовать напрямую значит
// СОЗНАТЕЛЬНО отказаться от механики createRestClient и взять конфигурацию на себя
// (см. README, раздел "Анатомия").
//
// На успехе и на ошибке — одна и та же форма `{ response, data }` (на ошибке она же летит внутри
// брошенного HTTPError): инструмент, которому нужен статус/заголовки ответа, а не только тело
// (постман-подобный просмотр запроса), не теряет их именно на успешном пути.
export async function rawRestRequest<TResult = unknown>(
  input: string | URL,
  init: RestRequestInit = {},
): Promise<RestResult<TResult>> {
  const response = await sendRequest(input, init);
  const data = (await parseBody(response)) as TResult;
  if (!response.ok) throw new HTTPError(response, data);
  return { response, data };
}

// Удобный по умолчанию путь — только данные, без обёртки, для queryFn/mutationFn, которым статус
// не нужен (частый случай: если запрос дошёл сюда, значит response.ok, иначе кинуло HTTPError).
export async function restRequest<TResult = unknown>(
  input: string | URL,
  init: RestRequestInit = {},
): Promise<TResult> {
  const { data } = await rawRestRequest<TResult>(input, init);
  return data;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function mergeHeaders(clientHeaders: HeadersInit | undefined, callHeaders: HeadersInit | undefined): Headers {
  const headers = new Headers(clientHeaders);
  new Headers(callHeaders).forEach((value, key) => headers.set(key, value));
  return headers;
}

// Основной способ — createRestClient({ baseUrl, headers? }) один раз при старте приложения,
// дальше используется как есть в любом queryFn/mutationFn: baseUrl/headers не повторяются на
// каждый вызов, per-call headers из init перекрывают клиентские по тому же имени. `raw` — та же
// пара `response`+`data`, что у `rawRestRequest`, но с конфигом клиента, не url на каждый вызов.
export function createRestClient(config: { baseUrl: string; headers?: HeadersInit }): {
  request: <TResult = unknown>(path: string, init?: RestRequestInit) => Promise<TResult>;
  raw: <TResult = unknown>(path: string, init?: RestRequestInit) => Promise<RestResult<TResult>>;
} {
  return {
    request: (path, init = {}) =>
      restRequest(joinUrl(config.baseUrl, path), { ...init, headers: mergeHeaders(config.headers, init.headers) }),
    raw: (path, init = {}) =>
      rawRestRequest(joinUrl(config.baseUrl, path), { ...init, headers: mergeHeaders(config.headers, init.headers) }),
  };
}
