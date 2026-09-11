// `ensureComponentSkin` — механика допечатки CSS одного компонента, без Solid (тот слой — в
// `solid/`). jsdom нужен для `document.head`/`document.documentElement`, поэтому `.test.tsx`,
// как у `skin-provider.test.tsx` — проект "kit" в vitest.config.ts, не "model".

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_STORAGE_KEY } from "../src/wear/memory.js";
import { makeSkinSwitch, type ComponentSkinSource, type SkinSource } from "../src/wear/switch.js";

function stubSource(components?: ComponentSkinSource): SkinSource {
  return { names: () => ["brand"], css: () => "/* base */", components };
}

beforeEach(() => {
  localStorage.removeItem(DEFAULT_STORAGE_KEY);
  document.documentElement.removeAttribute("data-skin");
});

afterEach(() => {
  document.head.querySelectorAll("[data-web-core-skin]").forEach((el) => el.remove());
});

describe("ensureComponentSkin — источник без ленивой способности или ничего не надето", () => {
  it("без source.components — тихий no-op, ни одного тега не появилось", async () => {
    const skin = makeSkinSwitch(stubSource());
    await skin.wear("brand");
    await skin.ensureComponentSkin("button", { kind: "variant", value: "primary" });

    expect(document.head.querySelectorAll("[data-web-core-skin]")).toHaveLength(1); // только базовый лист
  });

  it("ничего не надето — тихий no-op, ensure() у источника не звали вовсе", async () => {
    const ensure = vi.fn().mockResolvedValue("/* button */");
    const skin = makeSkinSwitch(stubSource({ ensure }));

    await skin.ensureComponentSkin("button", { kind: "variant", value: "primary" });
    expect(ensure).not.toHaveBeenCalled();
  });
});

describe("ensureComponentSkin — допечатка в СВОЙ тег компонента", () => {
  it("первый вызов заводит тег компонента с полученным CSS", async () => {
    const ensure = vi.fn().mockResolvedValue("[data-scope=\"button\"] { color: red; }");
    const skin = makeSkinSwitch(stubSource({ ensure }));
    await skin.wear("brand");

    await skin.ensureComponentSkin("button", { kind: "variant", value: "primary" });

    expect(ensure).toHaveBeenCalledWith("brand", "button", { kind: "variant", value: "primary" });
    const tag = document.head.querySelector('[data-web-core-skin="button"]');
    expect(tag?.textContent).toBe('[data-scope="button"] { color: red; }');
  });

  it("второй вызов на тот же компонент кладёт в ТОТ ЖЕ тег, не заводит второй", async () => {
    const ensure = vi.fn().mockResolvedValueOnce("/* v1 */").mockResolvedValueOnce("/* v1+v2 */");
    const skin = makeSkinSwitch(stubSource({ ensure }));
    await skin.wear("brand");

    await skin.ensureComponentSkin("button", { kind: "variant", value: "primary" });
    await skin.ensureComponentSkin("button", { kind: "variant", value: "secondary" });

    expect(document.head.querySelectorAll('[data-web-core-skin="button"]')).toHaveLength(1);
    expect(document.head.querySelector('[data-web-core-skin="button"]')?.textContent).toBe("/* v1+v2 */");
  });

  it("разные компоненты получают разные теги", async () => {
    const ensure = vi.fn().mockResolvedValueOnce("/* button */").mockResolvedValueOnce("/* input */");
    const skin = makeSkinSwitch(stubSource({ ensure }));
    await skin.wear("brand");

    await skin.ensureComponentSkin("button", { kind: "variant", value: "primary" });
    await skin.ensureComponentSkin("input", { kind: "variant", value: "primary" });

    expect(document.head.querySelector('[data-web-core-skin="button"]')?.textContent).toBe("/* button */");
    expect(document.head.querySelector('[data-web-core-skin="input"]')?.textContent).toBe("/* input */");
  });

  it("наряд сменился, пока источник ещё отвечал — устаревший результат не допечатывается", async () => {
    let resolveFirst!: (css: string) => void;
    const ensure = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string>((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce("/* second-brand button */");

    const skin = makeSkinSwitch(stubSource({ ensure }));
    await skin.wear("brand");

    const pending = skin.ensureComponentSkin("button", { kind: "variant", value: "primary" });
    await skin.wear("second-brand");
    resolveFirst("/* stale brand button */");
    await pending;

    expect(document.head.querySelector('[data-web-core-skin="button"]')).toBeNull();
  });

  it("takeOff() снимает и базовый лист, и все листы компонентов", async () => {
    const ensure = vi.fn().mockResolvedValue("/* button */");
    const skin = makeSkinSwitch(stubSource({ ensure }));
    await skin.wear("brand");
    await skin.ensureComponentSkin("button", { kind: "variant", value: "primary" });

    skin.takeOff();

    expect(document.head.querySelectorAll("[data-web-core-skin]")).toHaveLength(0);
  });
});
