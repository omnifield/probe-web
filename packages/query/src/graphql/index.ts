import { GraphQLClient } from "graphql-request";
import type { RequestDocument, Variables } from "graphql-request";

// Основной способ — createGraphQLClient({ url, headers? }) один раз при старте приложения,
// дальше используется как есть в любом queryFn/mutationFn: url/headers не повторяются на каждый
// вызов. Под капотом — GraphQLClient самого graphql-request: он, в отличие от urql/Apollo, кэша
// не держит — только url+headers, так что философии "не тащим второй кэш поверх solid-query"
// здесь ничего не противоречит.
export function createGraphQLClient(config: { url: string; headers?: HeadersInit }): {
  request: <TResult = unknown, TVariables extends Variables = Variables>(
    document: RequestDocument,
    variables?: TVariables,
  ) => Promise<TResult>;
} {
  const client = new GraphQLClient(config.url, { headers: config.headers });
  return {
    request: (document, variables) => client.request(document, variables as Variables),
  };
}

// Внутренности движка — url на каждый вызов, без клиента. Использовать напрямую значит
// СОЗНАТЕЛЬНО отказаться от механики createGraphQLClient и взять конфигурацию на себя
// (см. README, раздел "Анатомия").
export { request as graphqlRequest, gql, ClientError } from "graphql-request";
export type { RequestDocument, RequestExtendedOptions, Variables } from "graphql-request";
