// ГЕЙТ КАРТЫ: каждая часть каждого паспорта нарисована (`PWEB-84`).
//
// Предмет пробы — не «есть карта у гармошки». Предмет в том, что расхождение карты с паспортом
// ловится У НАС и по ВСЕМ паспортам сразу: пять сегодня, пятьдесят один после волны разноса.
// Добавит кит шестую часть без компонента — краснеет здесь, а не остаётся неодетой у двадцати
// потребителей.
//
// Перечень компонентов здесь не ведётся: проба идёт по `PASSPORTS`, а тот порождается обходом
// папок. Список, дописываемый руками, зеленел бы ровно на том компоненте, который в него забыли
// вписать, — то есть на единственном, который и надо было поймать.

import { describe, expect, it } from "vitest";

import { defineKitComponent, KIT, kitOf } from "../src/index.js";
import { PASSPORTS } from "../src/passport.js";
import type { ComponentPassport } from "../src/passport-form.js";

const паспорта = Object.values(PASSPORTS);

/** Паспорт, у которого перечень частей подменён, — материал мутаций ниже. */
function сЧастями(passport: ComponentPassport, keys: string[]): ComponentPassport {
  return { ...passport, anatomy: { ...passport.anatomy, keys: () => keys } };
}

describe("карта компонентов лежит рядом с паспортами", () => {
  it("паспорта вообще есть", () => {
    // Иначе перебор ниже шёл бы по пустому перечню и был бы зелёным, ничего не проверив.
    expect(паспорта.length).toBeGreaterThan(0);
  });

  it("карта есть у КАЖДОГО паспорта — ни одного объявленного и ненарисованного", () => {
    // Равенство, а не вхождение: лишняя запись в карте — компонент, которого никто не объявлял,
    // и он так же невиден, как недостача.
    expect(Object.keys(KIT).sort()).toEqual(Object.keys(PASSPORTS).sort());
  });

  describe.each(паспорта.map((passport) => [passport.component, passport] as const))(
    "%s",
    (component, passport) => {
      it("карта покрывает все части паспорта — ровно их, без своих", () => {
        const parts = kitOf(component)?.parts ?? {};

        expect(Object.keys(parts).sort()).toEqual([...passport.anatomy.keys()].sort());
      });

      it("каждая часть нарисована компонентом, а не значением", () => {
        // `typeof` здесь не придирка: то, что нельзя позвать, отрисовка молча заменит запасным
        // видом — часть окажется неодетой ровно так же, как если бы её в карте не было.
        for (const part of passport.anatomy.keys()) {
          expect(typeof kitOf(component)?.parts[part]).toBe("function");
        }
      });

      it("паспорт в паре — ТОТ ЖЕ, что уезжает подпутём `./passport`", () => {
        // Два перечня порождены одним обходом папок; проверка стережёт, что они не разъехались.
        // Разъедься — потребитель одевал бы по одному паспорту, а рисовал по другому.
        expect(kitOf(component)?.passport).toBe(PASSPORTS[component]);
      });
    },
  );
});

describe("расхождение карты с паспортом называется, а не молчит", () => {
  const passport = PASSPORTS.accordion!;
  const parts = KIT.accordion!.parts;

  it("часть паспорта без компонента — отказ называет ЧАСТЬ", () => {
    // Мутация «добавь паспорту шестую часть»: перечень анатомии знает о ней, карта — нет.
    expect(() => defineKitComponent(сЧастями(passport, [...passport.anatomy.keys(), "itemBadge"]), parts))
      .toThrow(/itemBadge/);
  });

  it("компонент, убранный из карты, — отказ называет ту же ЧАСТЬ", () => {
    const { itemIndicator: _убран, ...обрезанная } = parts;

    expect(() => defineKitComponent(passport, обрезанная as typeof parts)).toThrow(/itemIndicator/);
  });

  it("часть, которой в паспорте нет, — отказ называет и её", () => {
    // Обратная сторона: карта не вправе объявлять свои части. Такая запись не адресуема ничем, а
    // потребитель искал бы в паспорте то, чего там никогда не было.
    expect(() => defineKitComponent(сЧастями(passport, ["root"]), parts)).toThrow(/item/);
  });

  it("часть, нарисованная не компонентом, — отказ называет её", () => {
    expect(() => defineKitComponent(passport, { ...parts, itemContent: "не компонент" as never }))
      .toThrow(/itemContent/);
  });
});
