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
    // flag, не choice — реальный баг был именно на flag-настройке (`Workspace`'s `outlined`):
    // компонент передаёт пропс по ИМЕНИ НАСТРОЙКИ ("outlined": boolean), а на разметку сам
    // проставляет атрибут ("data-outlined": "true"/отсутствует) — это две разные строки, путать их
    // нельзя.
    outlined: {
      values: { kind: "flag" },
      byDefault: false,
      mark: { kind: "attribute", name: "data-outlined" },
    },
    filled: {
      values: { kind: "flag" },
      byDefault: true,
      mark: { kind: "attribute", name: "data-filled" },
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

  it("зовёт ensureComponentSkin с setting по ИМЕНИ НАСТРОЙКИ, не по имени атрибута", async () => {
    const ensure = vi.fn().mockResolvedValue("/* css */");

    function Probe() {
      // Пропс — "outlined" (имя настройки в passport.settings), НЕ "data-outlined" (то, что
      // компонент сам проставит на разметку своей формулой). Баг был ровно в путанице этих двух —
      // Workspace's `outlined?: boolean` пришёл как `outlined={true}`, не `data-outlined="true"`.
      useComponentSkin(passport, { "data-variant": "primary", outlined: true });
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

    expect(ensure).toHaveBeenCalledWith("brand", "button", { kind: "setting", name: "outlined", value: "true" });
  });

  it("настройка не названа в props — эффективное значение берётся из byDefault, не пропускается", async () => {
    const ensure = vi.fn().mockResolvedValue("/* css */");

    function Probe() {
      // Ни "outlined", ни "filled" не переданы вовсе — как рендерится большинство реальных
      // экземпляров. byDefault у "filled" — true: то самое значение, которое компонент САМ
      // проставит на разметку без явного пропса (`local.filled === false ? undefined : "true"`) —
      // пропустить его значило бы не подгрузить стиль для состояния, которое реально на экране.
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

    expect(ensure).toHaveBeenCalledWith("brand", "button", { kind: "setting", name: "outlined", value: "false" });
    expect(ensure).toHaveBeenCalledWith("brand", "button", { kind: "setting", name: "filled", value: "true" });
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
