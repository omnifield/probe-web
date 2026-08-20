import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";

import { createThemeController, registerTheme } from "../src/theme.js";
import { LEGACY_TOKENS, ROLE_TOKENS } from "../src/roles.js";
import { SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";

// ГЕЙТ ПО СУЩЕСТВУ (`PWEB-3`, п. 2–3).
//
// Проверка «взял наш токен» отвечает на вопрос о ПРОИСХОЖДЕНИИ значения, а спрашивать надо о
// его поведении: следует ли значение за режимом и за выбранной палитрой. Разница видна ровно
// на этой пробе — оформление, собранное из ЧУЖИХ значений, первую проверку не проходит, а
// вторую проходит. Пока проходит только первая, наш набор значений — фундамент, а не один из
// поставщиков, и право скина не брать наши значения держится словом.
//
// Здесь нет ни одного нашего токена, ни одного нашего инструмента и ни одной строки нашего
// CSS: `base.css` в этом прогоне не подключён вовсе. Всё, что берётся у нас, — механика тем,
// то есть способ выбрать палитру и режим, а не сами значения.

/** Чужой набор значений: имена придуманы другим поставщиком, состав его собственный. */
const FOREIGN_LIGHT = { ink: "#111111", paper: "#fdfdfd", rule: "1px" };
const FOREIGN_DARK = { ink: "#eeeeee", paper: "#0b0b0b", rule: "1px" };

/** Второй чужой поставщик — другой состав и другие значения, пересечение только по `ink`. */
const OTHER_LIGHT = { ink: "#2b3a67", edge: "#c9d4ff" };

const read = (doc: Document, name: string): string =>
  doc.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(name).trim() ?? "";

describe("проба честна: взятые имена — чужие", () => {
  // Без этой проверки проба тихо перестала бы быть про чужие значения: достаточно, чтобы
  // одно из имён совпало с нашим, и «оформление без наших значений» уже неправда, а прогон
  // остаётся зелёным.
  it("ни одно имя из проб не входит в наши перечни", () => {
    const ours = new Set<string>([
      ...SCALE_TOKENS,
      ...THEME_META_TOKENS,
      ...ROLE_TOKENS,
      ...LEGACY_TOKENS,
    ]);

    for (const name of [
      ...Object.keys(FOREIGN_LIGHT),
      ...Object.keys(FOREIGN_DARK),
      ...Object.keys(OTHER_LIGHT),
    ]) {
      expect(ours.has(name), `${name} — наше имя, проба перестала быть про чужие значения`).toBe(
        false,
      );
    }
  });
});

describe("чужой набор значений едет механикой тем", () => {
  it("значение следует за РЕЖИМОМ", () => {
    createRoot((dispose) => {
      const controller = createThemeController({
        themes: [{ name: "foreign", light: FOREIGN_LIGHT, dark: FOREIGN_DARK }],
        initialTheme: "foreign",
      });

      expect(read(document, "--ink")).toBe("#111111");
      controller.toggleMode();
      expect(read(document, "--ink")).toBe("#eeeeee");
      controller.toggleMode();
      expect(read(document, "--ink")).toBe("#111111");

      controller.setTheme(undefined);
      dispose();
    });
  });

  it("значение следует за ВЫБРАННОЙ палитрой", () => {
    createRoot((dispose) => {
      registerTheme({ name: "foreign", light: FOREIGN_LIGHT, dark: FOREIGN_DARK });
      registerTheme({ name: "other", light: OTHER_LIGHT });

      const controller = createThemeController({ initialTheme: "foreign" });
      expect(read(document, "--ink")).toBe("#111111");

      controller.setTheme("other");
      expect(read(document, "--ink")).toBe("#2b3a67");
      // Состав у поставщиков разный, и это законно: палитра — товар целиком, а не заполнение
      // нашей анкеты. Значение, которого во второй палитре нет, просто перестаёт объявляться.
      expect(read(document, "--paper")).toBe("");
      expect(read(document, "--edge")).toBe("#c9d4ff");

      controller.setTheme(undefined);
      dispose();
    });
  });

  it("палитра снята — значений нет, и это рабочее состояние, а не поломка", () => {
    createRoot((dispose) => {
      const controller = createThemeController({
        themes: [{ name: "foreign", light: FOREIGN_LIGHT }],
        initialTheme: "foreign",
      });

      expect(read(document, "--ink")).toBe("#111111");
      controller.setTheme(undefined);
      expect(read(document, "--ink")).toBe("");
      expect(document.documentElement.hasAttribute("data-theme")).toBe(false);

      dispose();
    });
  });

  it("наших токенов на документе нет ни одного — проверка их и не спрашивает", () => {
    // Оборотная сторона гейта: если бы механика тем везла с собой наш набор, чужая палитра
    // приезжала бы «поверх нашего», и «без наших значений» было бы неправдой. Тут смотрим
    // прямо: ни ядро, ни роли на корне не объявлены, а вид при этом работает.
    createRoot((dispose) => {
      const controller = createThemeController({
        themes: [{ name: "foreign", light: FOREIGN_LIGHT }],
        initialTheme: "foreign",
      });

      for (const token of [...SCALE_TOKENS.slice(0, 5), ...ROLE_TOKENS.slice(0, 5)]) {
        expect(read(document, `--${token}`), `--${token} приехал вместе с механикой`).toBe("");
      }
      expect(read(document, "--ink")).toBe("#111111");

      controller.setTheme(undefined);
      dispose();
    });
  });
});
