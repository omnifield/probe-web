import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPresetsClient } from "../src/presets/client/index.js";
import { variantsOf } from "../src/presets/variants.js";

const URL = "http://presets.test/graphql";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("variantsOf — варианты компонента в рамках ОДНОГО надетого наряда", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("находит форму компонента, входящую в outfit.forms, и отдаёт её варианты с тегами", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            presets: [
              { id: "1", label: "Brand", name: "brand", kind: "outfit", palette: { name: "base" }, forms: [{ name: "button-brand" }] },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            presets: [
              {
                id: "2",
                label: "Button (brand)",
                name: "button-brand",
                kind: "form",
                component: "button",
                recipe: {
                  variants: { primary: {}, quiet: {}, danger: {} },
                },
                variantTags: { primary: ["default"], danger: ["cta"] },
              },
            ],
          },
        }),
      );

    const client = createPresetsClient({ url: URL });
    const variants = await variantsOf(client, "brand", "button");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(variants).toEqual([
      { name: "primary", tags: ["default"] },
      { name: "quiet", tags: ["default"] },
      { name: "danger", tags: ["cta"] },
    ]);
  });

  it("наряда с таким именем нет — пустой список, не отказ", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { presets: [] } }));

    const client = createPresetsClient({ url: URL });
    const variants = await variantsOf(client, "missing", "button");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(variants).toEqual([]);
  });

  it("наряд не одевает этот компонент — пустой список, не отказ", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          data: {
            presets: [{ id: "1", label: "Brand", name: "brand", kind: "outfit", palette: { name: "base" }, forms: [{ name: "dialog-brand" }] }],
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { data: { presets: [] } }));

    const client = createPresetsClient({ url: URL });
    const variants = await variantsOf(client, "brand", "button");

    expect(variants).toEqual([]);
  });
});
