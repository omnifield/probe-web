// Кейсы в сайдбаре: нажал — фильтр собрался.
//
// Проверяется не «список рисуется», а то, ради чего кейсы заведены: человек тыкает в описание
// случая и получает НАСТОЯЩИЙ фильтр, который дальше видно и можно править. Плюс два свойства,
// которые ломаются молча: числа на карточке должны быть ПОСЧИТАННЫМИ (а не написанными когда-то
// руками), а место кейсов — только страница отбора.

import { afterEach, describe, expect, it } from "vitest";

import { applyFilter, describeFilter, labelsOf } from "../src/filters/index.js";
import { App } from "../src/playground/app.jsx";
import { COLUMNS, PRESETS, ROWS } from "../src/playground/data.js";
import { all, cleanup, mount, one, press } from "./dom.jsx";

afterEach(() => {
  cleanup();
  globalThis.location.hash = "";
});

/** Кейсы живут на странице отбора — стенд поднимаем сразу там. */
function standOnFilters() {
  globalThis.location.hash = "#/filters";
  return mount(() => <App />);
}

const LABELS = labelsOf(COLUMNS);

const card = (host: ParentNode, id: string) => one(host, `[data-case='${id}']`);

describe("список кейсов", () => {
  it("слева стоят все готовые сборки, каждая со своей подписью", () => {
    const host = standOnFilters();

    expect(all(host, ".page__case").length).toBe(PRESETS.length);
    for (const preset of PRESETS) {
      expect(card(host, preset.id).textContent).toContain(preset.label);
      if (preset.hint) expect(card(host, preset.id).textContent).toContain(preset.hint);
    }
  });

  it("кейсы идут от простого к сложному: первый — одно условие, последний — формула", () => {
    const first = PRESETS[0]!;
    const last = PRESETS[PRESETS.length - 1]!;

    expect(first.state.conditions.length).toBe(1);
    expect(first.state.logic.mode).toBe("all");
    expect(last.state.conditions.length).toBeGreaterThan(2);
    expect(last.state.logic.mode).toBe("formula");
  });

  it("фраза на карточке — та же, что покажет итог, а не отдельный текст", () => {
    const host = standOnFilters();

    for (const preset of PRESETS) {
      expect(card(host, preset.id).textContent).toContain(describeFilter(preset.state, LABELS));
    }
  });

  it("«оставит N из M» ПОСЧИТАНО на текущих строках, а не написано руками", () => {
    const host = standOnFilters();

    for (const preset of PRESETS) {
      const left = applyFilter(ROWS, preset.state, { fields: COLUMNS }).rows.length;
      expect(card(host, preset.id).textContent).toContain(`оставит ${left} из ${ROWS.length}`);
    }
  });
});

describe("место кейсов", () => {
  it("на странице переходника кейсов НЕТ: разговор про готовые отборы там посторонний", () => {
    const host = mount(() => <App />);

    expect(host.querySelector(".page__case")).toBeNull();
    expect(host.querySelector(".page__side")).toBeNull();
  });

  it("колонка кейсов появляется вместе со страницей отбора", () => {
    const host = mount(() => <App />);
    expect(one(host, ".page__body").getAttribute("data-side")).toBe("none");

    press(all(host, ".page__nav-link")[1]!);

    expect(one(host, ".page__body").getAttribute("data-side")).toBe("cases");
    expect(all(host, ".page__case").length).toBe(PRESETS.length);
  });
});

describe("нажатие собирает фильтр", () => {
  it("простой кейс: условие появилось в конструкторе, тут же, где на него нажали", () => {
    const host = standOnFilters();
    const simple = PRESETS[0]!;

    press(card(host, simple.id));

    expect(all(host, "[data-slot~='filter-condition']").length).toBe(simple.state.conditions.length);
    expect(one(host, ".page__phrase").textContent).toBe(describeFilter(simple.state, LABELS));
  });

  it("сложный кейс приносит формулу, а не просто список условий через И", () => {
    const host = standOnFilters();
    const hard = PRESETS[PRESETS.length - 1]!;

    press(card(host, hard.id));

    expect(all(host, "[data-slot~='filter-condition']").length).toBe(hard.state.conditions.length);
    // Строка логики видна: у сложного случая она и есть главное, что нужно разглядеть.
    expect(host.querySelector("[data-slot~='filter-logic-input']")).not.toBeNull();
  });

  it("отбор доезжает до показа: счётчик итога совпадает с обещанием карточки", () => {
    const host = standOnFilters();
    const preset = PRESETS[2]!;
    const left = applyFilter(ROWS, preset.state, { fields: COLUMNS }).rows.length;

    press(card(host, preset.id));

    expect(one(host, ".page__result .page__count").textContent).toContain(
      `Отобрано ${left} из ${ROWS.length}`,
    );
  });

  it("собранный фильтр правится как свой — условие снимается", () => {
    const host = standOnFilters();

    press(card(host, PRESETS[0]!.id));
    press(one(host, "[data-slot~='filter-condition-remove']"));

    expect(all(host, "[data-slot~='filter-condition']").length).toBe(0);
  });

  it("повторное нажатие кейса ЗАМЕНЯЕТ сборку, а не копит условия поверх прежних", () => {
    const host = standOnFilters();
    const hard = PRESETS[PRESETS.length - 1]!;

    press(card(host, hard.id));
    press(card(host, hard.id));

    expect(all(host, "[data-slot~='filter-condition']").length).toBe(hard.state.conditions.length);
  });

  it("формула сложного кейса ссылается на его условия, а не в пустоту", () => {
    const host = standOnFilters();

    press(card(host, PRESETS[PRESETS.length - 1]!.id));

    // Удалённое или ненайденное условие конструктор показывает в формуле как «?» — и это
    // ровно тот след, который оставляет сборка с непереписанными идентификаторами.
    expect(one<HTMLInputElement>(host, "[data-slot~='filter-logic-input']").value).not.toContain("?");
    expect(host.querySelector("[data-slot~='filter-logic-error']")).toBeNull();
  });

  it("готовых сборок нет второй раз внутри конструктора — одно место, а не два", () => {
    const host = standOnFilters();
    press(card(host, PRESETS[0]!.id));

    expect(host.querySelector("[data-slot~='filter-preset']")).toBeNull();
    // Шаблоны остаются: они спрашивают значения, и без конструктора им негде это сделать.
    expect(host.querySelector("[data-slot~='filter-template']")).not.toBeNull();
  });
});
