import { createRoot } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { paletteSelector } from "../src/palette.js";
import { createThemeController, registerTheme } from "../src/theme.js";
import type { ThemeDefinition, ThemeTokens } from "../src/tokens.js";
import { LIGHT, PALETTE } from "./helpers/seeds.js";

const palette = (overrides: Partial<ThemeTokens> = {}): ThemeDefinition => ({
  name: "ocean",
  light: { ...LIGHT, primary: "oklch(0.6 0.15 240)", ...overrides },
});

afterEach(() => {
  document.head.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-theme");
});

describe("registerTheme", () => {
  it("инжектит блок палитры под её собственным селектором", () => {
    registerTheme(palette());

    const el = document.getElementById("probe-web-theme-ocean");
    expect(el).not.toBeNull();
    expect(el?.textContent).toContain('[data-theme="ocean"] {');
    expect(el?.textContent).toContain("--primary: oklch(0.6 0.15 240);");
  });

  it("идемпотентно по имени: повторный вызов заменяет содержимое, а не плодит теги", () => {
    registerTheme(palette());
    registerTheme(palette({ primary: "oklch(0.4 0.2 20)" }));

    expect(document.head.querySelectorAll("style").length).toBe(1);
    const css = document.getElementById("probe-web-theme-ocean")?.textContent ?? "";
    expect(css).toContain("--primary: oklch(0.4 0.2 20);");
    expect(css).not.toContain("oklch(0.6 0.15 240)");
  });

  it("селектор инжекта выводится из имени — тот же, что и у файла палитры", () => {
    // Инжект и генератор файла обязаны цеплять палитру ОДИНАКОВО: разъедься они, одна и та
    // же палитра дала бы разный вид в зависимости от того, как её подключили. Держит это
    // не совпадение строк, а общий вывод селектора (`src/palette.ts`).
    registerTheme({ ...palette(), dark: { ...LIGHT } });
    const css = document.getElementById("probe-web-theme-ocean")?.textContent ?? "";

    expect(css).toContain(`${paletteSelector("ocean", "light")} {`);
    expect(css).toContain(`${paletteSelector("ocean", "dark")} {`);
    expect(css, "инжект красит корень").not.toContain(":root");
  });

  it("тёмный вариант палитры получает свой селектор; без него блок один", () => {
    registerTheme({ ...palette(), dark: { ...LIGHT, background: "oklch(0.2 0 0)" } });
    const css = document.getElementById("probe-web-theme-ocean")?.textContent ?? "";
    expect(css).toContain('[data-theme="ocean"].dark, [data-theme="ocean"] .dark {');

    document.head.innerHTML = "";
    registerTheme(palette());
    const single = document.getElementById("probe-web-theme-ocean")?.textContent ?? "";
    expect(single).not.toContain(".dark");
  });
});

describe("createThemeController", () => {
  it("режим и палитра ортогональны: каждый меняется, не трогая другого", () => {
    // Инвариант 3 (`kb:SKIN-7`): `data-theme` отвечает за костюм, класс режима — за
    // светло/темно. Связав их, мы вернули бы `twitter-dark` отдельной темой.
    createRoot((dispose) => {
      const theme = createThemeController({ initialTheme: "ocean" });

      theme.setMode("dark");
      expect(document.documentElement.getAttribute("data-theme")).toBe("ocean");
      theme.toggleMode();
      expect(document.documentElement.getAttribute("data-theme")).toBe("ocean");
      expect(theme.theme()).toBe("ocean");

      theme.setMode("dark");
      theme.setTheme(PALETTE);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(theme.mode()).toBe("dark");

      theme.setTheme(undefined);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      dispose();
    });
  });

  it("дефолт: светлый режим, без атрибута палитры", () => {
    createRoot((dispose) => {
      const theme = createThemeController();

      expect(theme.mode()).toBe("light");
      expect(theme.theme()).toBeUndefined();
      expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      dispose();
    });
  });

  it("режим переключается и в сигнале, и на элементе", () => {
    createRoot((dispose) => {
      const theme = createThemeController();

      theme.setMode("dark");
      expect(theme.mode()).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      theme.toggleMode();
      expect(theme.mode()).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      dispose();
    });
  });

  it("палитра ставится атрибутом; `undefined` СНИМАЕТ её, а не возвращает дефолтную", () => {
    // Zero-config снят сознательно (`kb:PROBEWEB-18`): прежний вид «из коробки» — это
    // `PALETTE`, названный явно, как и любая другая палитра. Контроллер его НЕ
    // подставляет — подставив, он вернул бы покрашенный по умолчанию документ, только уже
    // из JS, и «пресет не стоит» снова стало бы невыразимым состоянием.
    createRoot((dispose) => {
      const theme = createThemeController({ themes: [palette()] });

      theme.setTheme("ocean");
      expect(theme.theme()).toBe("ocean");
      expect(document.documentElement.getAttribute("data-theme")).toBe("ocean");

      theme.setTheme(PALETTE);
      expect(document.documentElement.getAttribute("data-theme")).toBe(PALETTE);

      theme.setTheme(undefined);
      expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
      dispose();
    });
  });

  it("палитры из опций регистрируются на старте", () => {
    createRoot((dispose) => {
      createThemeController({ themes: [palette()] });
      expect(document.getElementById("probe-web-theme-ocean")).not.toBeNull();
      dispose();
    });
  });

  it("стартовые значения применяются к элементу сразу, без первого вызова сеттера", () => {
    createRoot((dispose) => {
      createThemeController({
        themes: [palette()],
        initialTheme: "ocean",
        initialMode: "dark",
      });

      expect(document.documentElement.getAttribute("data-theme")).toBe("ocean");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      dispose();
    });
  });

  it("контроллер per-instance: два экземпляра не делят состояние", () => {
    createRoot((dispose) => {
      const first = createThemeController({ target: document.createElement("div") });
      const second = createThemeController({ target: document.createElement("div") });

      first.setMode("dark");
      expect(second.mode()).toBe("light");
      dispose();
    });
  });

  it("`target` уводит и класс, и атрибут с documentElement", () => {
    createRoot((dispose) => {
      const host = document.createElement("div");
      const theme = createThemeController({ target: host });

      theme.setMode("dark");
      theme.setTheme("ocean");

      expect(host.classList.contains("dark")).toBe(true);
      expect(host.getAttribute("data-theme")).toBe("ocean");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      dispose();
    });
  });
});
