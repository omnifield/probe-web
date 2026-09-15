import { createQuery, queryOptions } from "@tanstack/solid-query";
import type { QueryClient, QueryKey } from "@tanstack/solid-query";
import type { Accessor } from "solid-js";

export function defineQuery<TData, TArg = void>(
  queryClient: QueryClient,
  queryKey: (arg: TArg) => QueryKey,
  queryFn: (arg: TArg) => Promise<TData>,
  config?: { staleTime?: number },
) {
  const options = (arg?: TArg) =>
    queryOptions({ queryKey: queryKey(arg as TArg), queryFn: () => queryFn(arg as TArg), ...config });

  function query(arg?: TArg): Promise<TData> {
    return queryClient.query<TData>(options(arg));
  }
  query.use = (arg?: Accessor<TArg>) => createQuery(() => options(arg?.()));

  return query;
}
