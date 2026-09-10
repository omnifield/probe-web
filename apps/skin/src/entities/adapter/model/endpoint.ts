export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface EndpointHeader {
  readonly key: string;
  readonly value: string;
}

export interface Endpoint {
  readonly id: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers: readonly EndpointHeader[];
  readonly body: string;
}

export const HTTP_METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function methodHasBody(method: HttpMethod): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH";
}
