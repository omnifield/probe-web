// ПРАВКА ПО КООРДИНАТЕ — чтение и запись внутри рецепта (`PWEB-31`, редактор формы).
//
// Проверяется не «объект поменялся», а три обещания, на которых стоит экран формы:
//
//   1. координата у редактора ТА ЖЕ, что у витрины и у скина: часть · вариация · состояние;
//   2. правка не оставляет обещаний, которых нет, — пустых веток в записи;
//   3. «пусто» и «унаследовано» различимы: человеку видно, перебивает он что-то или пишет с нуля.
//
// Третье — не удобство. Поле, показывающее пустоту там, где значение приходит от базы, заставляет
// человека писать его заново; так в записи заводится второй источник одного и того же вида.

import type { SlotRecipe } from "@omnifield/probe-web-skin/model";
import { describe, expect, it } from "vitest";

import { inherited, styleAt, withProp, type Spot } from "../src/editor/spot.js";

/** Рецепт с базой, состоянием и вариацией — по одному значению на каждое место. */
const RECIPE: SlotRecipe = {
  base: {
    root: {
      props: { background: "var(--нейтраль-1)", color: "var(--нейтраль-12)" },
      states: { hover: { props: { background: "var(--нейтраль-3)" } } },
    },
  },
  variants: {
    главная: { root: { props: { background: "var(--акцент-9)" } } },
  },
  defaultVariant: "главная",
};

const базовое: Spot = { part: "root", variant: null, state: null };

describe("чтение по координате", () => {
  it("база — это координата без вариации и без состояния", () => {
    expect(styleAt(RECIPE, базовое)).toEqual({
      background: "var(--нейтраль-1)",
      color: "var(--нейтраль-12)",
    });
  });

  it("состояние читается отдельно от обычного вида", () => {
    expect(styleAt(RECIPE, { part: "root", variant: null, state: "hover" })).toEqual({
      background: "var(--нейтраль-3)",
    });
  });

  it("вариация отдаёт СВОЁ, а не сумму с базой", () => {
    // Сумма — то, что увидит браузер; содержимое поля — то, что написано здесь. Покажи мы
    // сумму, человек правил бы значение, которого в этой координате нет.
    expect(styleAt(RECIPE, { part: "root", variant: "главная", state: null })).toEqual({
      background: "var(--акцент-9)",
    });
  });

  it("на пустой координате пусто, а не выдумано", () => {
    expect(styleAt(RECIPE, { part: "root", variant: "главная", state: "hover" })).toEqual({});
    expect(styleAt(RECIPE, { part: "нет-такой", variant: null, state: null })).toEqual({});
  });
});

describe("унаследованное отличимо от пустого", () => {
  it("вариация видит базу, но не выдаёт её за своё", () => {
    const spot: Spot = { part: "root", variant: "главная", state: null };

    expect(styleAt(RECIPE, spot)).not.toHaveProperty("color");
    expect(inherited(RECIPE, spot)).toEqual({ color: "var(--нейтраль-12)" });
  });

  it("объявленное на координате в наследство не попадает — иначе оно значилось бы дважды", () => {
    const spot: Spot = { part: "root", variant: "главная", state: null };

    expect(inherited(RECIPE, spot)).not.toHaveProperty("background");
  });

  it("состояние вариации наследует и от базы, и от состояния базы, и от самой вариации", () => {
    const spot: Spot = { part: "root", variant: "главная", state: "hover" };
    const от = inherited(RECIPE, spot);

    expect(от["color"]).toBe("var(--нейтраль-12)");
    // Порядок складывания тот же, что в CSS: вариация перебивает состояние базы.
    expect(от["background"]).toBe("var(--акцент-9)");
  });
});

describe("запись по координате", () => {
  it("кладёт свойство, не трогая прежний рецепт", () => {
    const стало = withProp(RECIPE, базовое, "borderRadius", "var(--radius-md)");

    expect(styleAt(стало, базовое)["borderRadius"]).toBe("var(--radius-md)");
    expect(styleAt(RECIPE, базовое)).not.toHaveProperty("borderRadius");
  });

  it("заводит координату, которой в записи не было", () => {
    const spot: Spot = { part: "root", variant: "главная", state: "hover" };
    const стало = withProp(RECIPE, spot, "background", "var(--акцент-10)");

    expect(styleAt(стало, spot)).toEqual({ background: "var(--акцент-10)" });
  });

  it("снятое свойство уходит вместе с пустой веткой", () => {
    const spot: Spot = { part: "root", variant: null, state: "hover" };
    const стало = withProp(RECIPE, spot, "background", undefined);

    // Ветка `states.hover` с пустыми свойствами осталась бы обещанием правила, которого нет:
    // отчёт о долге прочёл бы его как «наведение одето».
    expect(стало.base?.["root"]?.states).toBeUndefined();
    expect(styleAt(стало, базовое)["background"]).toBe("var(--нейтраль-1)");
  });

  it("вариация без свойств остаётся — имя принадлежит человеку, а не содержимому", () => {
    const spot: Spot = { part: "root", variant: "главная", state: null };
    const стало = withProp(RECIPE, spot, "background", undefined);

    // Разметка приложения уже ссылается на имя вариации; исчезни оно на последнем снятом
    // свойстве — приложение осталось бы с именем, которого в скине нет.
    expect(Object.keys(стало.variants ?? {})).toContain("главная");
    expect(styleAt(стало, spot)).toEqual({});
  });

  it("умолчание вариации правка не трогает", () => {
    const стало = withProp(RECIPE, базовое, "color", undefined);

    expect(стало.defaultVariant).toBe("главная");
  });
});
