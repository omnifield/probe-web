import { resolveAccessHeaders } from "./access.js";
import type { NeuroboxAccessOptions } from "./access.js";

/**
 * Снимок расхода `GET /api/agent/{threadId}/spent`, как есть — накопительный итог по потоку, не
 * дельта хода. `NEUROBOX_CLIENT.md`, раздел «Расход»: цена хода как разница с записанным итогом уже
 * "соврала почти втрое" — пакет намеренно не считает дельты, это дело потребителя. Ориентир —
 * токены (`cache_read_tokens` растёт быстрее всего), не `cost_micros`.
 */
export interface NeuroboxSpend {
  thread: string;
  runs: number;
  prompt_tokens: number;
  completion_tokens: number;
  cache_read_tokens: number;
  cost_micros: number;
}

export interface NeuroboxSpendOptions extends NeuroboxAccessOptions {
  /** Адрес бокса. Пусто — запрос идёт относительным путём (`/api/agent/...`). */
  baseUrl?: string;
  fetchClient?: typeof fetch;
}

export async function fetchNeuroboxSpend(threadId: string, options: NeuroboxSpendOptions): Promise<NeuroboxSpend> {
  const fetchClient = options.fetchClient ?? fetch;
  const baseUrl = options.baseUrl ?? "";
  const headers = await resolveAccessHeaders(options);

  const response = await fetchClient(`${baseUrl}/api/agent/${threadId}/spent`, {
    method: "GET",
    headers,
  });
  if (!response.ok) {
    throw new Error(`Нейробокс отказал в снимке расхода: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as NeuroboxSpend;
}
