import type { Form, Palette } from "@web-core/skin/model";

const BASE = process.env["SKIN_MCP_PRESETS_URL"] ?? "http://127.0.0.1:8787/api/presets";

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
