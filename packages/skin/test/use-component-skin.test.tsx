// `useComponentSkin` — реактивный вызов ensureComponentSkin по значению variant/setting. jsdom
// нужен через `SkinProvider`/`makeSkinSwitch` (document.head), поэтому проект "kit".

import { createAnatomy } from "@zag-js/anatomy";
import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { definePassport } from "../src/engine/passport/form/index.js";
import { DEFAULT_STORAGE_KEY } from "../src/wear/memory.js";
import type { ComponentSkinAxis, SkinSource } from "../src/wear/switch.js";
import { SkinProvider, useComponentSkin } from "../src/solid/index.js";

type EnsureMock = ReturnType<typeof vi.fn<(outfitName: string, component: string, axis: ComponentSkinAxis) => Promise<string>>>;

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
      mark: { kind: "attribute", name: "data-outlined" },
    },
  },
});

function stubSource(ensure: EnsureMock): SkinSource {
  return { names: () => ["brand"], css: () => "/* base */", components: { ensure } };
}

// Обычный интерфейс БЕЗ индексной сигнатуры — так типизированы реальные пропсы кита
// (AccordionRootProps/DialogRootProps и т.д. от Kobalte/Ark). Если бы `useComponentSkin` принимала
// `Record<string, unknown>` вместо `object`, эта строка не скомпилировалась бы без `as` на стороне
// вызывающего — ровно баг, который поймал owner кита на 24 из 32 компонентов.
interface KobalteLikeRootProps {
  readonly "data-variant"?: string;
  readonly disabled?: boolean;
}

function typesAcceptPlainInterfaceProps(props: KobalteLikeRootProps): void {
  useComponentSkin(passport, props);
}
void typesAcceptPlainInterfaceProps;

let dispose: (() => void) | undefined;

beforeEach(() => {
  localStorage.removeItem(DEFAULT_STORAGE_KEY);
  document.documentElement.removeAttribute("data-skin");
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("useComponentSkin — без SkinProvider", () => {
  it("тихий no-op, не бросает", () => {
    expect(() => useComponentSkin(passport, { "data-variant": "primary" })).not.toThrow();
  });
});

describe("useComponentSkin — внутри SkinProvider", () => {
  it("зовёт ensureComponentSkin с variant из props при первом эффекте", async () => {
    const ensure = vi.fn().mockResolvedValue("/* css */");

    function Probe() {
      useComponentSkin(passport, { "data-variant": "primary" });
      return null;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <SkinProvider source={stubSource(ensure)} options={{ fallback: { skin: "brand" } }}>
          <Probe />
        </SkinProvider>
      ),
      host,
    );

    await tick();
    await tick();

    expect(ensure).toHaveBeenCalledWith("brand", "button", { kind: "variant", value: "primary" });
  });

  it("зовёт ensureComponentSkin с setting из props, когда значение есть", async () => {
    const ensure = vi.fn().mockResolvedValue("/* css */");

    function Probe() {
      useComponentSkin(passport, { "data-variant": "primary", "data-outlined": "lg" });
      return null;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <SkinProvider source={stubSource(ensure)} options={{ fallback: { skin: "brand" } }}>
          <Probe />
        </SkinProvider>
      ),
      host,
    );

    await tick();
    await tick();

    expect(ensure).toHaveBeenCalledWith("brand", "button", { kind: "setting", name: "outlined", value: "lg" });
  });

  it("изменение variant на разметке — повторный вызов с НОВЫМ значением", async () => {
    const ensure = vi.fn().mockResolvedValue("/* css */");
    const [variant, setVariant] = createSignal("primary");

    function Probe() {
      // Геттер, не заранее вычисленное значение — так реально устроены props у Solid-компонента:
      // `useComponentSkin` читает свойство ВНУТРИ своего эффекта, и только геттер делает это чтение
      // трекнутым. Плоский литерал `{ "data-variant": variant() }` вычислил бы значение ОДИН раз,
      // при первом (и единственном) вызове тела Probe — эффект после этого никогда не увидел бы новое.
      useComponentSkin(passport, {
        get "data-variant"() {
          return variant();
        },
      });
      return null;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <SkinProvider source={stubSource(ensure)} options={{ fallback: { skin: "brand" } }}>
          <Probe />
        </SkinProvider>
      ),
      host,
    );

    await tick();
    await tick();
    ensure.mockClear();

    setVariant("secondary");
    await tick();
    await tick();

    expect(ensure).toHaveBeenCalledWith("brand", "button", { kind: "variant", value: "secondary" });
  });
});
