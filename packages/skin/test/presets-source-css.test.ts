// `createPresetsSkinSource`'s `css()` — база наряда (переменные палитры/шрифт/mode), БЕЗ форм.
// Формы приносит лениво сам компонент (`useComponentSkin`/`ensureComponentSkin`) — эта заявка
// закрывает найденный owner'ом `apps/skin` пробел: старый `css()` тянул ВСЕ формы, обесценивая
// экономию нового механизма (см. FAQ.md, `component-skin-on-demand`).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import type { Outfit, Palette } from "../src/engine/look/index.js";
import { createPresetsSkinSource } from "../src/presets/source.js";

const URL = "http://presets.test/graphql";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const PALETTE: Palette = {
  name: "brand",
  scales: { accent: "#3457d5", neutral: "#6b7280", danger: "#c2282e", success: "#197a3d", warning: "#a35a06" },
  dimensions: {
    radius: "10px",
    space: { narrow: "0.375rem", wide: "0.5rem", between: ["360px", "1280px"] },
    "font-size": { narrow: "0.9375rem", wide: "1rem", between: ["360px", "1280px"] },
    column: "1rem",
    "control-height": { narrow: "2rem", wide: "2.25rem", between: ["360px", "1280px"] },
    rail: { narrow: "12rem", wide: "14rem", between: ["360px", "1280px"] },
    card: { narrow: "20rem", wide: "24rem", between: ["360px", "1280px"] },
    layout: { narrow: "64rem", wide: "80rem", between: ["360px", "1280px"] },
    "border-width": "1px",
    tracking: "0em",
    density: "1",
  },
  light: {
    "leading-none": "1",
    "leading-tight": "1.2",
    "leading-snug": "1.35",
    "leading-normal": "1.5",
    "leading-relaxed": "1.7",
    "weight-normal": "400",
    "weight-medium": "500",
    "weight-semibold": "600",
    "weight-bold": "700",
    "motion-instant": "75ms",
    "motion-fast": "150ms",
    "motion-normal": "250ms",
    "motion-slow": "400ms",
    "ease-linear": "linear",
    "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
    "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
    "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    "accent-contrast": "#ffffff",
    "danger-contrast": "#ffffff",
    "success-contrast": "#ffffff",
    "warning-contrast": "#ffffff",
  },
  dark: {
    "accent-contrast": "#ffffff",
    "danger-contrast": "#ffffff",
    "success-contrast": "#ffffff",
    "warning-contrast": "#ffffff",
    "accent-9": "#3457d5",
    "accent-10": "#4062df",
    "danger-9": "#c2282e",
    "danger-10": "#d13237",
    "success-9": "#197a3d",
    "success-10": "#1a8040",
    "warning-9": "#a35a06",
    "warning-10": "#aa5e06",
  },
};

// Наряд объявляет 30+ форм — ровно случай owner'а apps/skin: css() не обязан их знать, чтобы
// напечатать базу.
const OUTFIT: Outfit = {
  name: "omnifield",
  palette: PALETTE.name,
  forms: Array.from({ length: 30 }, (_, i) => `form-${i}`),
};

function fetchMockFor() {
  return vi.fn(async (_url: unknown, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as { variables: { kind: string } };
    const kind = body.variables.kind;

    if (kind === "outfit") {
      return jsonResponse(200, {
        data: {
          presets: [
            {
              id: "1",
              label: "",
              name: OUTFIT.name,
              kind,
              palette: { name: OUTFIT.palette },
              forms: OUTFIT.forms.map((name) => ({ name })),
              tags: [],
            },
          ],
        },
      });
    }
    if (kind === "palette") {
      return jsonResponse(200, { data: { presets: [{ id: "2", label: "", kind, ...PALETTE }] } });
    }

    // Любой другой kind (в первую очередь "form") — регрессия: css() не обязан его спрашивать.
    return jsonResponse(200, { data: { presets: [] } });
  });
}

let fetchMock: ReturnType<typeof fetchMockFor>;

beforeEach(() => {
  fetchMock = fetchMockFor();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createPresetsSkinSource — css() больше не тянет формы", () => {
  it("ни разу не запрашивает kind=form, даже когда у наряда 30 форм", async () => {
    const source = createPresetsSkinSource({ url: URL, lookup: passportLookup([]) });
    await source.css(OUTFIT.name);

    const kinds = fetchMock.mock.calls.map(
      (call) => (JSON.parse(String((call[1] as RequestInit).body)) as { variables: { kind: string } }).variables.kind,
    );
    expect(kinds).not.toContain("form");
    expect(kinds.sort()).toEqual(["outfit", "palette"]);
  });

  it("несёт переменные палитры (базу), но ни одного правила компонента", async () => {
    const source = createPresetsSkinSource({ url: URL, lookup: passportLookup([]) });
    const css = await source.css(OUTFIT.name);

    expect(css).toContain("--accent-9"); // база — переменные палитры
    expect(css).not.toContain('[data-scope='); // ни одного правила по компоненту
  });
});
