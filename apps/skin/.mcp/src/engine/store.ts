import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { Form, Palette } from "@web-core/skin/model";

/** Путь ручки у службы — держит сам бэк константой (`root` в
 *  `backend/presets/internal/api/handler.go`). Не настройка. */
const API_PATH = "/api/presets";

/** Служба на этой же машине — когда снаружи не сказано ничего. */
const LOCAL = "http://127.0.0.1:8787";

/** Корень воркспейса по маркеру, вверх от места запуска. Тот же приём и тот же довод, что в
 *  `packages/build` (`vite/app.ts`): считать `../..` от файла нельзя — пакет резолвится
 *  симлинком, а сервер запускают из разных папок. */
function workspaceRoot(from: string = process.cwd()): string | undefined {
  let dir = resolve(from);

  for (;;) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;

    const up = dirname(dir);
    if (up === dir) return undefined;
    dir = up;
  }
}

/** Подтягивает корневой `.env` воркспейса в `process.env`.
 *
 *  Фронту его читает Vite, а этот сервер — отдельный процесс, до него Vite не дотягивается: без
 *  этого шага витрина уже ходила бы на стенд, а MCP молча остался бы на службе своей машины, и
 *  агент правил бы НЕ ТЕ пресеты, которые человек видит в браузере. Файла нет — не беда, дальше
 *  работают умолчания. Заданное в окружении сильнее файла: так стенд переопределяют на одну
 *  команду, не трогая общий файл. */
function loadWorkspaceEnv(): void {
  const root = workspaceRoot();
  if (root === undefined) return;

  const file = resolve(root, ".env");
  if (!existsSync(file)) return;

  try {
    process.loadEnvFile(file);
  } catch {
    // Нечитаемый или битый файл — не повод не подняться: адрес возьмётся из умолчаний.
  }
}

loadWorkspaceEnv();

/** Адрес службы. `SKIN_MCP_PRESETS_URL` — ручка именно этого процесса, `PRESETS_URL` — общий
 *  адрес воркспейса из корневого `.env`, тот же, что читает витрина. Путь дописываем сами, если
 *  дали только адрес службы: в `.env` естественно записать `https://host:port`. */
function resolveBase(): string {
  const given = process.env["SKIN_MCP_PRESETS_URL"] ?? process.env["PRESETS_URL"];
  const base = (given ?? "").trim().replace(/\/+$/, "") || LOCAL;

  return base.endsWith(API_PATH) ? base : base + API_PATH;
}

const BASE = resolveBase();

export class StoreRefused extends Error {}
export class StoreDown extends Error {}

async function ask(url: string, init?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (cause) {
    throw new StoreDown(`служба пресетов не отвечает по адресу ${new URL(url).origin} — ${SERVICE_HINT}`, { cause });
  }

  if (response.ok) return response;

  if (response.status < 500) {
    const said = (await response.text().catch(() => "")).trim();
    throw new StoreRefused(said === "" ? `служба отказала (${response.status})` : said);
  }

  throw new StoreDown(`служба ответила ${response.status}`);
}

export const SERVICE_HINT = "pnpm --filter @web-core/presets start";

export interface StoreRecord {
  readonly id: string;
  readonly label: string;
  readonly name?: string;
  readonly kind?: string;
  readonly savedAt: string;
}

export interface StoreEntry extends StoreRecord {
  readonly state: unknown;
}

export async function list(kind: string): Promise<StoreRecord[]> {
  const response = await ask(`${BASE}?kind=${encodeURIComponent(kind)}`);
  const body = (await response.json()) as { items: StoreRecord[] };
  return body.items;
}

export async function read(id: string): Promise<StoreEntry> {
  const response = await ask(`${BASE}/${encodeURIComponent(id)}`);
  return (await response.json()) as StoreEntry;
}

export async function findByName(kind: string, name: string): Promise<StoreRecord | undefined> {
  const items = await list(kind);
  return items.find((item) => item.name === name);
}

export async function save(kind: string, name: string, state: unknown, label?: string) {
  const response = await ask(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, name, label: label ?? name, state }),
  });
  return await response.json();
}

export async function remove(id: string): Promise<void> {
  await ask(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** Замена содержимого С СОХРАНЕНИЕМ id, одним вызовом — в отличие от `replace`. Разбор — FAQ.md. */
export async function update(id: string, kind: string, name: string, state: unknown, label?: string) {
  const response = await ask(`${BASE}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, name, label: label ?? name, state }),
  });
  return await response.json();
}

export async function replace(kind: string, name: string, state: unknown, label?: string) {
  const existing = await findByName(kind, name);
  if (existing) await remove(existing.id);
  return await save(kind, name, state, label);
}

export async function readAllOf(kind: string): Promise<unknown[]> {
  const items = await list(kind);
  const entries = await Promise.all(items.map((item) => read(item.id)));
  return entries.map((entry) => entry.state);
}

export async function readPalettes(): Promise<Palette[]> {
  return (await readAllOf("palette")) as Palette[];
}

export async function readForms(): Promise<Form[]> {
  return (await readAllOf("form")) as Form[];
}
