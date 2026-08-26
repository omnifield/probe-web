// Проба против фикстуры REST — повторяет конверт настоящей службы (`products/presets/src/
// http.js`), но не тянет её как зависимость: пакет `mcp` не должен знать о её внутренностях,
// только о контракте `GET /api/presets` / `GET /api/presets/{id}`.

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { presetsTools } from "../../src/tools/presets.js";

const RECORD = { id: "abc", label: "Тёмная", kind: "skin", savedAt: "2026-08-20T00:00:00.000Z" };

describe("presetsTools", () => {
  let server: ReturnType<typeof createServer>;
  let origin: string;

  beforeEach(async () => {
    server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://fixture.local");
      res.setHeader("content-type", "application/json");

      if (url.pathname === "/api/presets") {
        const kind = url.searchParams.get("kind");
        res.writeHead(200);
        res.end(JSON.stringify({ items: kind === null || kind === "skin" ? [RECORD] : [] }));
        return;
      }
      if (url.pathname === "/api/presets/abc") {
        res.writeHead(200);
        res.end(JSON.stringify({ ...RECORD, state: { color: "midnight" } }));
        return;
      }
      res.writeHead(404);
      res.end(JSON.stringify({ error: "not_found", message: "Такого пресета нет." }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    origin = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("list_presets отдаёт перечень как есть", async () => {
    const [listPresetsTool] = presetsTools({ origin });
    const result = await listPresetsTool.handler({});
    expect(result.isError).toBeFalsy();
    const content = result.content as { type: string; text: string }[];
    const payload = JSON.parse(content[0]!.text) as { items: unknown[] };
    expect(payload.items).toEqual([RECORD]);
  });

  it("list_presets прокидывает ?kind= в запрос", async () => {
    const [listPresetsTool] = presetsTools({ origin });
    const result = await listPresetsTool.handler({ kind: "other" });
    const content = result.content as { type: string; text: string }[];
    const payload = JSON.parse(content[0]!.text) as { items: unknown[] };
    expect(payload.items).toEqual([]);
  });

  it("get_preset отдаёт запись целиком, включая state", async () => {
    const [, getPresetTool] = presetsTools({ origin });
    const result = await getPresetTool.handler({ id: "abc" });
    expect(result.isError).toBeFalsy();
    const content = result.content as { type: string; text: string }[];
    const payload = JSON.parse(content[0]!.text) as { state: unknown };
    expect(payload.state).toEqual({ color: "midnight" });
  });

  it("get_preset отказывает по делу на несуществующем id, а не падает", async () => {
    const [, getPresetTool] = presetsTools({ origin });
    const result = await getPresetTool.handler({ id: "missing" });
    expect(result.isError).toBe(true);
    const content = result.content as { type: string; text: string }[];
    expect(content[0]!.text).toContain("Такого пресета нет");
  });
});
