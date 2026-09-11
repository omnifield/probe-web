// `createLazyComponentSkin` — сеть+кеш+сборка ОДНОГО компонента, без DOM (тот слой — в
// `wear/switch.ts`, свой тест). Палитра — тот же полный фикстур, что у `packages/ui`'s
// `recipe.test.tsx` (закрывает VOCABULARY целиком, иначе `checkOutfit` бросит `palette-incomplete`
// независимо от того, какой компонент проверяется — это проверка САМОЙ палитры, не формы).

import { createAnatomy } from "@zag-js/anatomy";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import type { Form, Outfit, Palette } from "../src/engine/look/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";
import type { PresetKind, PresetRecord, PresetsClient } from "../src/presets/client.js";
import { createLazyComponentSkin } from "../src/presets/lazy.js";
import { PresetsRefused } from "../src/presets/wire.js";

const anatomy = createAnatomy("button").parts("root");
const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {
    outlined: {
      values: { kind: "choice", options: [{ value: "sm" }, { value: "lg" }] },
      byDefault: "sm",
      mark: { kind: "attribute", name: "data-size" },
    },
  },
});

const undressedAnatomy = createAnatomy("undressed").parts("root");
const undressedPassport = definePassport({
  anatomy: undressedAnatomy,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const lookup = passportLookup([passport, undressedPassport]);

const PALETTE: Palette = {
  name: "test-palette",
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

const OUTFIT: Outfit = { name: "brand", palette: PALETTE.name, forms: ["button-form", "other-form"] };
const SECOND_OUTFIT: Outfit = { name: "second-brand", palette: PALETTE.name, forms: ["button-form", "other-form"] };

const BUTTON_FORM: Form = {
  name: "button-form",
  component: "button",
  recipe: {
    base: { root: { props: { background: "#fff" } } },
    defaultVariant: "primary",
    variants: {
      primary: { root: { props: { color: "#111" } } },
      secondary: { root: { props: { color: "#222" } } },
    },
    settings: {
      outlined: {
        sm: { root: { props: { padding: "2px" } } },
        lg: { root: { props: { padding: "8px" } } },
      },
    },
  },
};

const OTHER_FORM: Form = { name: "other-form", component: "other", recipe: { base: { root: { props: {} } } } };

function record<K extends PresetKind, T>(kind: K, name: string, state: T): PresetRecord<T> {
  return { id: name, label: name, name, kind, savedAt: "now", state };
}

function fakeClient(): PresetsClient & { readonly listForm: ReturnType<typeof vi.fn> } {
  const listForm = vi.fn(async (component?: readonly string[]) => {
    const all = [BUTTON_FORM, OTHER_FORM];
    const filtered = component === undefined ? all : all.filter((form) => component.includes(form.component));
    return filtered.map((form) => record("form", form.name, form));
  });

  const client: PresetsClient = {
    list: (async (kind: PresetKind, options?: { component?: readonly string[] }) => {
      if (kind === "outfit") {
        return [record("outfit", OUTFIT.name, OUTFIT), record("outfit", SECOND_OUTFIT.name, SECOND_OUTFIT)];
      }
      if (kind === "palette") return [record("palette", PALETTE.name, PALETTE)];
      if (kind === "form") return listForm(options?.component);
      return [];
    }) as PresetsClient["list"],
    get: (async (kind: PresetKind, name: string) => (await client.list(kind)).find((item) => item.name === name)) as PresetsClient["get"],
    save: vi.fn(),
    replace: vi.fn(),
    remove: vi.fn(),
  };

  return Object.assign(client, { listForm });
}

describe("createLazyComponentSkin", () => {
  let client: ReturnType<typeof fakeClient>;

  beforeEach(() => {
    client = fakeClient();
  });

  it("первый ensure() тянет форму узким фетчем по component, не всем kind=form", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    await skin.ensure("brand", "button", { kind: "variant", value: "primary" });

    expect(client.listForm).toHaveBeenCalledWith(["button"]);
  });

  it("variant без value (на разметке нет атрибута) всё равно бутстрапит base+defaultVariant", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const css = await skin.ensure("brand", "button", { kind: "variant", value: undefined });

    expect(css).toContain("background: #fff"); // base
    expect(css).toContain("color: #111"); // defaultVariant primary
    expect(css).not.toContain("color: #222"); // secondary никто не просил
  });

  it("печатает base+defaultVariant даже когда просили другое значение — default не выпадает как unknown-variant", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const css = await skin.ensure("brand", "button", { kind: "variant", value: "secondary" });

    expect(css).toContain("background: #fff"); // base
    expect(css).toContain("color: #111"); // primary — default, грузится вместе с base
    expect(css).toContain("color: #222"); // secondary — то, что просили
  });

  it("второй ensure() на НОВОЕ значение не перезапрашивает форму сетью — кеш по компоненту", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    await skin.ensure("brand", "button", { kind: "variant", value: "primary" });
    await skin.ensure("brand", "button", { kind: "setting", name: "outlined", value: "lg" });

    expect(client.listForm).toHaveBeenCalledTimes(1);
  });

  it("накопленные значения сохраняются между вызовами — CSS второго вызова несёт и первое, и новое", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    await skin.ensure("brand", "button", { kind: "variant", value: "primary" });
    const css = await skin.ensure("brand", "button", { kind: "setting", name: "outlined", value: "lg" });

    expect(css).toContain("color: #111"); // выжило с первого вызова
    expect(css).toContain("padding: 8px"); // новое из второго
  });

  it("наряд сменился — накопление сбрасывается, форма запрашивается сетью снова", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    await skin.ensure("brand", "button", { kind: "variant", value: "primary" });
    await skin.ensure("second-brand", "button", { kind: "variant", value: "primary" });

    expect(client.listForm).toHaveBeenCalledTimes(2);
  });

  it("наряд не одевает компонент (форма отсутствует, паспорт есть) — легитимно, пустой CSS, не отказ", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const css = await skin.ensure("brand", "undressed", { kind: "variant", value: "x" });

    expect(css.trim().length).toBeGreaterThan(0); // валидный, хоть и пустой @layer
    expect(css).not.toContain("color:");
  });

  it("наряда нет в службе — PresetsRefused", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    await expect(skin.ensure("no-such-brand", "button", { kind: "variant", value: "primary" })).rejects.toBeInstanceOf(
      PresetsRefused,
    );
  });
});
