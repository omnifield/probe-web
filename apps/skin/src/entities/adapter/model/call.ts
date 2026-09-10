import { methodHasBody, type Endpoint } from "./endpoint";

export interface EndpointCallResult {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

export async function callEndpoint(endpoint: Endpoint): Promise<EndpointCallResult> {
  const headers: Record<string, string> = {};
  for (const header of endpoint.headers) {
    if (header.key !== "") headers[header.key] = header.value;
  }

  const response = await fetch(endpoint.url, {
    method: endpoint.method,
    headers,
    body: methodHasBody(endpoint.method) && endpoint.body !== "" ? endpoint.body : undefined,
  });

  const text = await response.text();

  let body: unknown;
  try {
    body = text === "" ? undefined : JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    status: response.status,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  };
}
