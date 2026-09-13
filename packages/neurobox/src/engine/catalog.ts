import { resolveAccessHeaders } from "./access.js";
import type { NeuroboxAccessOptions } from "./access.js";

/**
 * Каталожные ручки бокса (`NEUROBOX_CLIENT.md`, раздел «Что можно спросить») — сырые обёртки, БЕЗ
 * типизированной формы ответа. Решение (user, 2026-09-13): бокс сам называет протокол «растущим» и
 * молча пропускает незнакомые поля конверта — жёсткая типизация здесь рассинхронится с боксом при
 * первом же его обновлении (в обратную сторону от `spend`/`feedback` — те явно названные и
 * стабильные, эти открытые и растущие).
 */
export interface NeuroboxCatalogOptions extends NeuroboxAccessOptions {
  /** Адрес бокса. Пусто — запрос идёт относительным путём. */
  baseUrl?: string;
  fetchClient?: typeof fetch;
}

async function getNeuroboxJson(
  path: string,
  headers: Record<string, string>,
  options: { baseUrl?: string; fetchClient?: typeof fetch },
): Promise<unknown> {
  const fetchClient = options.fetchClient ?? fetch;
  const baseUrl = options.baseUrl ?? "";
  const response = await fetchClient(`${baseUrl}${path}`, { method: "GET", headers });
  if (!response.ok) {
    throw new Error(`Нейробокс отказал в ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/** `GET /api/catalog/recipes` — рецепты: с чем агент будет работать. */
export async function fetchNeuroboxRecipes(options: NeuroboxCatalogOptions): Promise<unknown> {
  return getNeuroboxJson("/api/catalog/recipes", await resolveAccessHeaders(options), options);
}

/** `GET /api/catalog/passports` — паспорта: чем агент будет думать. */
export async function fetchNeuroboxPassports(options: NeuroboxCatalogOptions): Promise<unknown> {
  return getNeuroboxJson("/api/catalog/passports", await resolveAccessHeaders(options), options);
}

/** `GET /api/agents` — рантаймы и их визитки. */
export async function fetchNeuroboxAgents(options: NeuroboxCatalogOptions): Promise<unknown> {
  return getNeuroboxJson("/api/agents", await resolveAccessHeaders(options), options);
}

/** `GET /api/catalog/seeds` — семена, из чего собраны рецепты. */
export async function fetchNeuroboxSeeds(options: NeuroboxCatalogOptions): Promise<unknown> {
  return getNeuroboxJson("/api/catalog/seeds", await resolveAccessHeaders(options), options);
}

/** `GET /api/catalog/refusals` — все имена отказов с объяснениями. */
export async function fetchNeuroboxRefusals(options: NeuroboxCatalogOptions): Promise<unknown> {
  return getNeuroboxJson("/api/catalog/refusals", await resolveAccessHeaders(options), options);
}

/** `GET /api/mcp/servers` — что зоны дают: перечень ручек и их вес. */
export async function fetchNeuroboxMcpServers(options: NeuroboxCatalogOptions): Promise<unknown> {
  return getNeuroboxJson("/api/mcp/servers", await resolveAccessHeaders(options), options);
}

/** `GET /api/health` — жив ли бокс. Единственная ручка бокса без токена — заголовки доступа не нужны. */
export async function fetchNeuroboxHealth(options: { baseUrl?: string; fetchClient?: typeof fetch } = {}): Promise<unknown> {
  return getNeuroboxJson("/api/health", {}, options);
}
