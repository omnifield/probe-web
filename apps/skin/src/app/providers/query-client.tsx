import type { JSX } from "solid-js";
import { QueryClientProvider as QueryClientProviderBase } from "@web-core/query";

import { queryClient } from "#/shared/api/clients";

export function QueryClientProvider(props: { children?: JSX.Element }) {
  return <QueryClientProviderBase client={queryClient}>{props.children}</QueryClientProviderBase>;
}
