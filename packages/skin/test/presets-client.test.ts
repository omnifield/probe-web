import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPresetsClient, PRESET_KIND } from "../src/presets/client.js";
import { PresetsDown, PresetsRefused } from "../src/presets/wire.js";

const URL = "http://presets.test/graphql";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function operationOf(call: unknown): string {
  const init = call as RequestInit;
  const body = JSON.parse(String(init.body)) as { query: string };
  return (/^\s*(?:query|mutation)\s+(\w+)/.exec(body.query))?.[1] ?? "";
}

describe("createPresetsClient — GraphQL транспорт, PresetRecord<T> наружу без изменений", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("list('outfit') сплющивает palette/forms/tags-связи в имена, как хочет канон Outfit", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          presets: [
            {
              id: "1",
              label: "Бренд",
              name: "brand",
              palette: { name: "base" },
              forms: [{ name: "f1" }, { name: "f2" }],
              tags: [{ name: "t1" }],
              overrides: { role: "value" },
              author: "egor",
            },
          ],
        },
      }),
    );

    const client = createPresetsClient({ url: URL });
    const items = await client.list(PRESET_KIND.outfit);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(operationOf(fetchMock.mock.calls[0]![1])).toBe("ListPresets");
    expect(items).toEqual([
      {
        id: "1",
        label: "Бренд",
        name: "brand",
        state: {
          name: "brand",
          palette: "base",
          forms: ["f1", "f2"],
          tags: ["t1"],
          overrides: { role: "value" },
          author: "egor",
        },
      },
    ]);
  });

  it("list('palette') несёт scales/dimensions/light/dark и author плоско, без резолва связей", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          presets: [
            {
              id: "2",
              label: "",
              name: "twitter",
              scales: { accent: "blue" },
              dimensions: null,
              light: { bg: "#fff" },
              dark: { bg: "#000" },
              author: "egor",
            },
          ],
        },
      }),
    );

    const client = createPresetsClient({ url: URL });
    const items = await client.list(PRESET_KIND.palette);

    // label пуст в проводе — падает на name, как и в старом REST-клиенте.
    expect(items).toEqual([
      {
        id: "2",
        label: "twitter",
        name: "twitter",
        state: {
          name: "twitter",
          scales: { accent: "blue" },
          dimensions: null,
          light: { bg: "#fff" },
          dark: { bg: "#000" },
          author: "egor",
        },
      },
    ]);
  });

  it("list('tag') несёт tagLabel как state.label — отдельно от верхнеуровневого record.label", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          presets: [{ id: "3", label: "status", name: "status", tagLabel: "Статусы", author: "egor" }],
        },
      }),
    );

    const client = createPresetsClient({ url: URL });
    const items = await client.list(PRESET_KIND.tag);

    expect(items).toEqual([
      {
        id: "3",
        label: "status",
        name: "status",
        state: { name: "status", label: "Статусы", author: "egor" },
      },
    ]);
  });

  it("get() фильтрует список на клиенте одним запросом — второго чтения по id не делает", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          presets: [
            { id: "1", label: "A", name: "a", component: "Button", recipe: {}, author: "egor" },
            { id: "2", label: "B", name: "b", component: "Button", recipe: {}, author: "egor" },
          ],
        },
      }),
    );

    const client = createPresetsClient({ url: URL });
    const found = await client.get(PRESET_KIND.form, "b");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(found?.id).toBe("2");
    expect(found?.state).toMatchObject({ name: "b", component: "Button" });
  });

  it("get() отдаёт undefined, когда имени в списке нет — не отказ", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { presets: [] } }));

    const client = createPresetsClient({ url: URL });
    await expect(client.get(PRESET_KIND.outfit, "missing")).resolves.toBeUndefined();
  });

  it("save() шлёт createPreset с переданным state как есть и берёт id из ответа", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { data: { createPreset: { id: "9", label: "Новый", name: "new" } } }),
    );

    const client = createPresetsClient({ url: URL });
    const state = { component: "Button", data: { size: "md" } };
    const saved = await client.save(PRESET_KIND.content, "new", state, "Новый");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(operationOf(fetchMock.mock.calls[0]![1])).toBe("CreatePreset");

    const body = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body)) as {
      variables: { input: unknown };
    };
    expect(body.variables.input).toEqual({ kind: "content", label: "Новый", name: "new", state });
    expect(saved).toEqual({ id: "9", label: "Новый", name: "new", state });
  });

  it("replace() при найденной записи шлёт ОДНУ атомарную replacePreset, не delete+create", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: { presets: [{ id: "5", label: "L", name: "brand" }] } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { replacePreset: { id: "5", label: "L", name: "brand" } } }));

    const client = createPresetsClient({ url: URL });
    const state = { name: "brand", palette: "base", forms: ["f1"] };
    const replaced = await client.replace(PRESET_KIND.outfit, "brand", state, "L");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(operationOf(fetchMock.mock.calls[1]![1])).toBe("ReplacePreset");

    const body = JSON.parse(String((fetchMock.mock.calls[1]![1] as RequestInit).body)) as {
      variables: { id: unknown };
    };
    expect(body.variables.id).toBe("5");
    expect(replaced).toEqual({ id: "5", label: "L", name: "brand", state });
  });

  it("replace() без прежней записи падает на save() — не отказывает", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: { presets: [] } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { createPreset: { id: "7", label: "L", name: "brand" } } }));

    const client = createPresetsClient({ url: URL });
    const replaced = await client.replace(
      PRESET_KIND.outfit,
      "brand",
      { name: "brand", palette: "base", forms: [] },
      "L",
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(operationOf(fetchMock.mock.calls[1]![1])).toBe("CreatePreset");
    expect(replaced.id).toBe("7");
  });

  it("remove() при отсутствии имени не шлёт мутацию — второй вызов идемпотентен", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { presets: [] } }));

    const client = createPresetsClient({ url: URL });
    await client.remove(PRESET_KIND.outfit, "gone");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("remove() при найденной записи шлёт deletePreset по id", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { data: { presets: [{ id: "3", label: "L", name: "brand" }] } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { deletePreset: true } }));

    const client = createPresetsClient({ url: URL });
    await client.remove(PRESET_KIND.outfit, "brand");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(operationOf(fetchMock.mock.calls[1]![1])).toBe("DeletePreset");
  });

  it("сетевой обрыв — PresetsDown, не PresetsRefused", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    const client = createPresetsClient({ url: URL });
    await expect(client.list(PRESET_KIND.palette)).rejects.toBeInstanceOf(PresetsDown);
  });

  it("HTTP 500 — PresetsDown", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { errors: [{ message: "внутренняя ошибка" }] }));

    const client = createPresetsClient({ url: URL });
    await expect(client.list(PRESET_KIND.palette)).rejects.toBeInstanceOf(PresetsDown);
  });

  it("HTTP 200 с errors в теле — PresetsRefused с текстом первой ошибки", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { errors: [{ message: "имя уже занято" }] }))
      .mockResolvedValueOnce(jsonResponse(200, { errors: [{ message: "имя уже занято" }] }));

    const client = createPresetsClient({ url: URL });
    await expect(client.list(PRESET_KIND.palette)).rejects.toThrow(PresetsRefused);
    await expect(client.list(PRESET_KIND.palette)).rejects.toThrow("имя уже занято");
  });

  it("HTTP 400 без GraphQL-конверта — тоже PresetsRefused, не PresetsDown", async () => {
    fetchMock.mockResolvedValueOnce(new Response("bad request", { status: 400 }));

    const client = createPresetsClient({ url: URL });
    await expect(client.list(PRESET_KIND.palette)).rejects.toBeInstanceOf(PresetsRefused);
  });
});
