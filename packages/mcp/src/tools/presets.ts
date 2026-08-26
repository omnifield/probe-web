// Прокси к REST-складу пресетов — `list_presets`/`get_preset` (ТЗ `PWEB-117`, п.2).
//
// Служба уже есть (`products/presets/src/http.js`) и формат фильтра не понимает: инструмент
// повторяет ровно её конверт, ничего не разбирая и не переизобретая — `GET /api/presets`
// (с необязательным `?kind=`) и `GET /api/presets/{id}`.
//
// Адрес службы — ПАРАМЕТР фабрики, а не константа: пакет `mcp` не знает, где именно продукт
// поднял `presets` (порт по умолчанию 8787, но это решает разворачивающий, не пакет).

import { z } from "zod";

import { defineMcpTool, type McpToolDefinition } from "../types.js";

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function failure(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

function readErrorMessage(body: unknown, response: Response): string {
  return body && typeof body === "object" && "message" in body
    ? String((body as { message: unknown }).message)
    : response.statusText;
}

export interface PresetsToolsOptions {
  /** Адрес службы пресетов, например `http://127.0.0.1:8787`. Без хвостового слэша. */
  readonly origin: string;
  /** Подмена транспорта для проб — по умолчанию глобальный `fetch`. */
  readonly fetchImpl?: typeof fetch;
}

/**
 * Инструменты пресетов — `list_presets`/`get_preset`, тем же плоским списком, что и остальные.
 *
 * @param options адрес живой службы пресетов
 */
export function presetsTools(options: PresetsToolsOptions): [McpToolDefinition, McpToolDefinition] {
  const { origin, fetchImpl = fetch } = options;

  const listPresetsTool = defineMcpTool({
    name: "list_presets",
    description: "Перечень пресетов (без содержимого state) — опционально отфильтрованный ярлыком вида kind.",
    inputSchema: {
      kind: z.string().optional().describe("Ярлык вида, например skin — тот же, что у GET /api/presets?kind="),
    },
    handler: async ({ kind }) => {
      const url = new URL("/api/presets", origin);
      if (kind !== undefined) url.searchParams.set("kind", kind);

      const response = await fetchImpl(url);
      const body = (await response.json()) as unknown;
      if (!response.ok) {
        return failure(`Склад пресетов отказал (${response.status}): ${readErrorMessage(body, response)}`);
      }
      return json(body);
    },
  });

  const getPresetTool = defineMcpTool({
    name: "get_preset",
    description: "Один пресет целиком по id, включая содержимое state.",
    inputSchema: {
      id: z.string().describe("Идентификатор записи — как в перечне list_presets"),
    },
    handler: async ({ id }) => {
      const url = new URL(`/api/presets/${encodeURIComponent(id)}`, origin);

      const response = await fetchImpl(url);
      const body = (await response.json()) as unknown;
      if (!response.ok) {
        return failure(`Склад пресетов отказал (${response.status}): ${readErrorMessage(body, response)}`);
      }
      return json(body);
    },
  });

  return [listPresetsTool, getPresetTool];
}
