// Транспорт для обычных REST-эндпоинтов, симметрично `../graphql`: та же роль (queryFn/mutationFn
// для createQuery/createMutation), но без вендора — у HTTP+JSON нет протокольных тонкостей вроде
// сборки {query, variables} и разбора ошибок GraphQL-ответа, которые оправдывали graphql-request
// там. Голого fetch с типизацией и разбором тела хватает, лишний пакет добавлял бы вес без пользы.

export type RestRequestInit = Omit<RequestInit, "body"> & {
  body?: RequestInit["body"];
  /** Сериализуется в JSON и уходит телом; выставляет `content-type: application/json`, если он не задан явно. */
  json?: unknown;
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

// Внутренности движка — url на каждый вызов, без клиента. Использовать напрямую значит
// СОЗНАТЕЛЬНО отказаться от механики createRestClient и взять конфигурацию на себя
// (см. README, раздел "Анатомия").
export async function restRequest<TResult = unknown>(
  input: string | URL,
  init: RestRequestInit = {},
): Promise<TResult> {
  const { json, headers, ...rest } = init;
  const requestHeaders = new Headers(headers);
  let body = rest.body;
  if (json !== undefined) {
    body = JSON.stringify(json);
    if (!requestHeaders.has("content-type")) requestHeaders.set("content-type", "application/json");
  }

  const response = await fetch(input, { ...rest, headers: requestHeaders, body });
  const data = await parseBody(response);
  if (!response.ok) throw new HTTPError(response, data);
  return data as TResult;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

// Основной способ — createRestClient({ baseUrl, headers? }) один раз при старте приложения,
// дальше используется как есть в любом queryFn/mutationFn: baseUrl/headers не повторяются на
// каждый вызов, per-call headers из init перекрывают клиентские по тому же имени.
export function createRestClient(config: { baseUrl: string; headers?: HeadersInit }): {
  request: <TResult = unknown>(path: string, init?: RestRequestInit) => Promise<TResult>;
} {
  return {
    request: (path, init = {}) => {
      const headers = new Headers(config.headers);
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
      return restRequest(joinUrl(config.baseUrl, path), { ...init, headers });
    },
  };
}
