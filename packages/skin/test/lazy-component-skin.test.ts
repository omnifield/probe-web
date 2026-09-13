// `createLazyComponentSkin` — сеть+кеш+сборка ОДНОГО компонента, без DOM (тот слой — в
// `wear/switch.ts`, свой тест). Палитра — тот же полный фикстур, что у `packages/ui`'s
// `recipe.test.tsx` (закрывает VOCABULARY целиком, иначе `checkOutfit` бросит `palette-incomplete`
// независимо от того, какой компонент проверяется — это проверка САМОЙ палитры, не формы).

import { createAnatomy } from "@zag-js/anatomy";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import type { Form, Outfit, Palette } from "../src/engine/look/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";
import type { PresetKind, PresetRecord, PresetsClient } from "../src/presets/client/index.js";
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

const accordionAnatomy = createAnatomy("accordion").parts("root", "content");
const accordionPassport = definePassport({
  anatomy: accordionAnatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    // Переменную и анимацию держит ОДНА и та же часть ("content") — так же, как в реальном
    // Accordion (`--height`/`--width`, `setBy: "kit"`): checkOutfit находит их согласованными
    // (та же часть), a skinRules — нет, потому что не находит применяющее правило в урезанном
    // scope (оно не в этом запросе), а не потому что переменная где-то не там.
    { name: "content", states: [], variables: [{ name: "--grow-size", setBy: "kit" }] },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {
    orientation: {
      values: { kind: "choice", options: [{ value: "vertical" }, { value: "horizontal" }] },
      byDefault: "vertical",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  },
});

const lookup = passportLookup([passport, undressedPassport, accordionPassport]);

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

const OUTFIT: Outfit = { name: "brand", palette: PALETTE.name, forms: ["button-form", "other-form", "accordion-form"] };
const SECOND_OUTFIT: Outfit = { name: "second-brand", palette: PALETTE.name, forms: ["button-form", "other-form"] };

const BUTTON_FORM: Form = {
  name: "button-form",
  component: "button",
  recipe: {
    base: { root: { props: { background: "#fff", borderColor: "var(--accent-9)" } } },
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

// Живой баг: keyframes объявлены на форму ЦЕЛИКОМ (обе стороны orientation в одном Form.keyframes),
// а применяет каждую — только СВОЁ значение settings.orientation. Запрос "vertical" (byDefault) не
// должен видеть "grow-inline-size" вовсе — оно принадлежит "horizontal", которое никто не просил.
const ACCORDION_FORM: Form = {
  name: "accordion-form",
  component: "accordion",
  recipe: {
    base: { root: { props: {} } },
    settings: {
      orientation: {
        vertical: { content: { props: { animation: "grow-block-size" } } },
        horizontal: { content: { props: { animation: "grow-inline-size" } } },
      },
    },
  },
  keyframes: {
    "grow-block-size": { from: { blockSize: "0" }, to: { blockSize: "10px" } },
    "grow-inline-size": { from: { inlineSize: "0" }, to: { inlineSize: "var(--grow-size)" } },
  },
};

function record<K extends PresetKind, T>(kind: K, name: string, state: T): PresetRecord<T> {
  return { id: name, label: name, name, kind, savedAt: "now", state };
}

function fakeClient(): PresetsClient & { readonly listForm: ReturnType<typeof vi.fn> } {
  const listForm = vi.fn(async (component?: readonly string[]) => {
    const all = [BUTTON_FORM, OTHER_FORM, ACCORDION_FORM];
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

  it("ссылка на переменную палитры (var(--accent-9)) не бросает SkinRefused — variables ПРИЗНАНЫ, не напечатаны", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const { css } = await skin.ensure("brand", "button", { kind: "variant", value: "primary" });

    expect(css).toContain("var(--accent-9)"); // ссылка признана известной, печатается как есть
    expect(css).not.toContain(":root {"); // но сама переменная не печатается — это дело базы (css())
  });

  it("variant без value (на разметке нет атрибута) всё равно бутстрапит base+defaultVariant", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const { css } = await skin.ensure("brand", "button", { kind: "variant", value: undefined });

    expect(css).toContain("background: #fff"); // base
    expect(css).toContain("color: #111"); // defaultVariant primary
    expect(css).not.toContain("color: #222"); // secondary никто не просил
  });

  it("печатает base+defaultVariant даже когда просили другое значение — default не выпадает как unknown-variant", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const { css } = await skin.ensure("brand", "button", { kind: "variant", value: "secondary" });

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
    const { css } = await skin.ensure("brand", "button", { kind: "setting", name: "outlined", value: "lg" });

    expect(css).toContain("color: #111"); // выжило с первого вызова
    expect(css).toContain("padding: 8px"); // новое из второго
  });

  it("наряд сменился — накопление сбрасывается, форма запрашивается сетью снова", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    await skin.ensure("brand", "button", { kind: "variant", value: "primary" });
    await skin.ensure("second-brand", "button", { kind: "variant", value: "primary" });

    expect(client.listForm).toHaveBeenCalledTimes(2);
  });

  it("кейфрейм, применённый ТОЛЬКО неспрошенным значением setting, — не печатается и не бросает SkinRefused", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    // Живой баг: запрашиваем "vertical" — grow-inline-size (со ссылкой на несуществующую
    // переменную) принадлежит "horizontal", никто его не просил. Раньше это бросало SkinRefused
    // ("not applied by any rule"), потому что keyframes формы печатались ЦЕЛИКОМ, без оглядки на
    // накопленный scope.
    const { css } = await skin.ensure("brand", "accordion", { kind: "setting", name: "orientation", value: "vertical" });

    expect(css).toContain("@keyframes grow-block-size");
    expect(css).not.toContain("grow-inline-size");
  });

  it("наряд не одевает компонент (форма отсутствует, паспорт есть) — легитимно, пустой CSS, не отказ", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const { css, data } = await skin.ensure("brand", "undressed", { kind: "variant", value: "x" });

    expect(css.trim().length).toBeGreaterThan(0); // валидный, хоть и пустой @layer
    expect(css).not.toContain("color:");
    expect(data).toBeUndefined(); // компонент не одет — формы нет, отдавать нечего
  });

  it("ensure() отдаёт наружу найденную запись формы — не только CSS (component-skin-data-passthrough)", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const { data } = await skin.ensure("brand", "button", { kind: "variant", value: "primary" });

    expect(data).toMatchObject({ name: "button-form", state: BUTTON_FORM });
  });

  it("второй ensure() того же компонента отдаёт ТУ ЖЕ запись формы — без повторного сетевого фетча", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const first = await skin.ensure("brand", "button", { kind: "variant", value: "primary" });
    const second = await skin.ensure("brand", "button", { kind: "setting", name: "outlined", value: "lg" });

    expect(second.data).toBe(first.data);
    expect(client.listForm).toHaveBeenCalledTimes(1);
  });

  it("ensure() отдаёт наружу записи наряда и палитры — не только CSS (outfit-data-passthrough)", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const { outfit } = (await skin.ensure("brand", "button", { kind: "variant", value: "primary" })) as {
      outfit: { outfit: PresetRecord<Outfit>; palette: PresetRecord<Palette> };
    };

    expect(outfit.outfit).toMatchObject({ name: "brand", state: OUTFIT });
    expect(outfit.palette).toMatchObject({ name: PALETTE.name, state: PALETTE });
  });

  it("наряд не одевает компонент — outfit/palette всё равно приходят, форма нашлась или нет к делу не относится", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    const { outfit } = (await skin.ensure("brand", "undressed", { kind: "variant", value: "x" })) as {
      outfit: { outfit: PresetRecord<Outfit>; palette: PresetRecord<Palette> };
    };

    expect(outfit.outfit).toMatchObject({ name: "brand" });
  });

  it("второй ensure() того же наряда отдаёт ТУ ЖЕ запись наряда — без повторного сетевого фетча", async () => {
    const client2 = fakeClient();
    const getOutfitSpy = vi.spyOn(client2, "get");
    const skin = createLazyComponentSkin({ client: client2, lookup });

    const first = await skin.ensure("brand", "button", { kind: "variant", value: "primary" });
    const second = await skin.ensure("brand", "button", { kind: "setting", name: "outlined", value: "lg" });

    expect(second.outfit).toBe(first.outfit);
    expect(getOutfitSpy).toHaveBeenCalledTimes(1);
  });

  it("наряда нет в службе — PresetsRefused", async () => {
    const skin = createLazyComponentSkin({ client, lookup });
    await expect(skin.ensure("no-such-brand", "button", { kind: "variant", value: "primary" })).rejects.toBeInstanceOf(
      PresetsRefused,
    );
  });
});
