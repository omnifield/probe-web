import { HTTPError, rawRestRequest } from "@web-core/query/rest";

import { methodHasBody, type Endpoint } from "./endpoint";

export interface EndpointCallResult {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

function toResult(response: Response, body: unknown): EndpointCallResult {
  return {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  };
}

// Постман-путь: не-2xx — валидный результат для показа в форме, не исключение, поэтому
// HTTPError из rawRestRequest ловится здесь и разбирается обратно в EndpointCallResult
// (он несёт ту же пару response+data, что и успех — см. README пакета, раздел "Анатомия").
export async function callEndpoint(endpoint: Endpoint): Promise<EndpointCallResult> {
  const headers: Record<string, string> = {};
  for (const header of endpoint.headers) {
    if (header.key !== "") headers[header.key] = header.value;
  }

  try {
    const { response, data } = await rawRestRequest(endpoint.url, {
      method: endpoint.method,
      headers,
      body: methodHasBody(endpoint.method) && endpoint.body !== "" ? endpoint.body : undefined,
    });
    return toResult(response, data);
  } catch (error) {
    if (error instanceof HTTPError) return toResult(error.response, error.data);
    throw error;
  }
}
