// ПРОБА: реестр зацепок сверен с ОБЕЩАНИЕМ кита, а не с его текущим кодом.
//
// Кит объявил список `data-slot` обязательством: имя из него не меняется и не исчезает без
// мажора (`packages/ui/test/slot-list.ts`). Мы цепляемся ровно за этот список, поэтому проба
// читает его и сверяет с тем, что реально одето.
//
// ПРЕДМЕТ ПРОБЫ — ПОЛНОТА НАШИХ СЕМЕЙСТВ, а не «одето всё, что есть у кита». Так было в первой
// редакции, и это оказалось неверно: кит выпускает волны быстрее, чем зона одевает, и проба
// краснела на КАЖДОМ его выпуске — наказывала за чужую работу и требовала правки списка вручную
// каждые несколько минут.
//
// Проверяется то, что действительно ломается молча:
//   • семейство, объявленное одетым, обязано быть одето ЦЕЛИКОМ — иначе у примитива одета
//     рамка и гола галочка, и замечает это только пользователь;
//   • мы не цепляемся за имена, которых кит не обещал (опечатка или выдумка);
//   • намеренно неодетые части названы поимённо с причиной, и список не расходится с фактом.
//
// Семейства, до которых зона ещё не дошла, попадают в ДОЛГ: он печатается числом и перечнем, но
// прогон не роняет. Долг — это работа в очереди, а не поломка.
//
// Читается ЧУЖОЙ файл — но только читается. Правка чужой зоны запрещена, чтение нет.

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { allSkinCss, stripComments, ZONE } from "./css.js";

/** Обещание зоны `ui` — источник истины по именам зацепок. */
function promisedSlots(): string[] {
  const text = readFileSync(join(ZONE, "..", "..", "packages", "ui", "test", "slot-list.ts"), "utf8");
  const body = text.slice(text.indexOf("PROMISED_SLOTS"));
  return [...body.matchAll(/"([a-z-]+)"/g)].map(([, name]) => name);
}

/** Зацепки, на которые у нас есть правила. */
function dressedSlots(): Set<string> {
  const out = new Set<string>();
  for (const [, name] of stripComments(allSkinCss()).matchAll(/\[data-slot~="([a-z-]+)"\]/g)) {
    out.add(name);
  }
  return out;
}

/**
 * СЕМЕЙСТВА, КОТОРЫЕ ЗОНА ОБЪЯВИЛА ОДЕТЫМИ. Каждое обязано быть одето целиком.
 *
 * Список ведётся руками намеренно: он и есть объявление «это семейство мы поддерживаем». Снятый
 * с кода перечень подтверждал бы сам себя, и полусоставной примитив прошёл бы молча.
 */
const DRESSED_FAMILIES = [
  "pagination",
  "navigation-menu",
  "menubar",
  "link",
  "image",
  "context-menu",
  "collapsible",
  "breadcrumbs",
  "alert-dialog",
  "accordion",
  "button",
  "checkbox",
  "combobox",
  "dialog",
  "dropdown-menu",
  "field",
  "input",
  "label",
  "number-field",
  "popover",
  "progress",
  "radio-group",
  "segmented-control",
  "select",
  "separator",
  "skeleton",
  "slider",
  "spinner",
  "switch",
  "tabs",
  "textarea",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
];

/**
 * ЧУЖИЕ СЕМЕЙСТВА, ИМЯ КОТОРЫХ НАЧИНАЕТСЯ КАК НАШЕ. Ведутся руками, потому что различить их
 * формально нельзя: и `checkbox-control` (часть нашего семейства), и `toggle-group` (отдельное
 * семейство кита) выглядят одинаково — имя с дефисом внутри.
 *
 * Поймано на живом случае: кит выпустил `ToggleGroup`, и проба потребовала одеть его как часть
 * нашего `toggle`. Пустой список тут был бы не «чисто», а «ждём ложного срабатывания».
 */
const FOREIGN_FAMILIES: string[] = [];

/** Относится ли зацепка к объявленному нами семейству. */
function inDressedFamily(slot: string): boolean {
  if (FOREIGN_FAMILIES.some((f) => slot === f || slot.startsWith(`${f}-`))) return false;
  return DRESSED_FAMILIES.some((family) => slot === family || slot.startsWith(`${family}-`));
}

/** Имя семейства для отчёта о долге: первое слово, либо чужое семейство целиком. */
function familyOf(slot: string): string {
  const foreign = FOREIGN_FAMILIES.find((f) => slot === f || slot.startsWith(`${f}-`));
  return foreign ?? slot.split("-").slice(0, 2).join("-");
}

/**
 * Части объявленных семейств, которые зона намеренно НЕ одевает, и почему.
 *
 * Запись здесь — утверждение о примитиве, а не способ отвязаться от пробы.
 */
const NOT_DRESSED: Record<string, string> = {
  // Указатели всплывающих: `fill` и `stroke` kobalte СЧИТЫВАЕТ с панели (покрасили панель —
  // указатель пошёл следом), а размер задаётся пропом `size`, потому что по нему считается
  // смещение панели. Правило здесь было бы вторым источником правды о цвете.
  "popover-arrow": "цвет приходит с панели, размер — пропом size",
  "tooltip-arrow": "цвет приходит с панели, размер — пропом size",
  "dropdown-menu-arrow": "цвет приходит с панели, размер — пропом size",

  // Узлы без собственного вида: существуют ради поведения и семантики.
  "popover-anchor": "точка привязки панели; в потоке не отображается",

  // Указатели и группировки ВСЕХ ЧЕТЫРЁХ меню: причина одна на все, поэтому и запись одна на
  // семейство. Указатель берёт цвет с панели, группировка существует ради доступности, а вид в
  // ней несёт подпись группы.
  "dropdown-menu-group": "группировка пунктов для доступности; вид несёт её подпись",
  "dropdown-menu-radio-group": "то же для группы переключателей",
  "context-menu-arrow": "цвет приходит с панели, размер — пропом size",
  "context-menu-group": "группировка пунктов; вид несёт подпись группы",
  "context-menu-radio-group": "то же для группы переключателей",
  "menubar-arrow": "цвет приходит с панели, размер — пропом size",
  "menubar-group": "группировка пунктов; вид несёт подпись группы",
  "menubar-radio-group": "то же для группы переключателей",
  "navigation-menu-arrow": "цвет приходит с панели, размер — пропом size",
  "navigation-menu-group": "группировка пунктов; вид несёт подпись группы",
  "navigation-menu-radio-group": "то же для группы переключателей",
  "tooltip-trigger": "обёртка над элементом, который и так одет; своего вида не имеет",
  "combobox-arrow": "цвет приходит с панели, размер — пропом size",

  // Спрятанные вводы для формы: их сокрытие — служебный стиль кита, и он стоит на ОБЁРТКЕ, а
  // не на зацепке. Оформлять здесь нечего, а трогать — значит спорить с китом за сокрытие.
  "combobox-hidden-select": "спрятанный select для формы; сокрытие держит кит на обёртке",
  "number-field-hidden-input": "спрятанный ввод для формы; сокрытие держит кит",
};

describe("реестр зацепок", () => {
  it("обещание кита прочитано", () => {
    expect(promisedSlots().length).toBeGreaterThan(0);
  });

  it("каждое объявленное семейство одето ЦЕЛИКОМ", () => {
    const dressed = dressedSlots();
    const promised = promisedSlots();
    const holes = promised.filter(
      (slot) => inDressedFamily(slot) && !dressed.has(slot) && !(slot in NOT_DRESSED),
    );

    expect(holes, "части объявленных семейств без правил — примитив одет наполовину").toEqual([]);
  });

  it("мы не цепляемся за имена, которых кит не обещал", () => {
    const promised = new Set(promisedSlots());
    const invented = [...dressedSlots()].filter((slot) => !promised.has(slot));

    expect(invented, "имена вне обещания кита").toEqual([]);
  });

  it("список намеренно неодетых не расходится с реальностью", () => {
    // Имя, попавшее в исключения и при этом одетое, — забытая запись: она врёт в доке и в отчёте.
    const dressed = dressedSlots();
    const stale = Object.keys(NOT_DRESSED).filter((slot) => dressed.has(slot));

    expect(stale, "числятся неодетыми, а правила есть").toEqual([]);
  });

  it("объявленные семейства существуют у кита", () => {
    // Иначе список семейств заживёт своей жизнью: снятое китом имя будет числиться нашим.
    const promised = promisedSlots();
    const ghosts = DRESSED_FAMILIES.filter(
      (family) => !promised.some((slot) => slot === family || slot.startsWith(`${family}-`)),
    );

    expect(ghosts, "объявлены одетыми семейства, которых у кита нет").toEqual([]);
  });

  it("долг одевания посчитан и назван", () => {
    // Это ОТЧЁТ, а не запрет: печатает, чего зона ещё не одела из выпущенного китом. Прогон не
    // роняет — работа в очереди поломкой не является. Но и молчать нельзя: неназванный долг
    // перестаёт быть долгом и становится забытым.
    const dressed = dressedSlots();
    const promised = promisedSlots();
    const debt = promised.filter((slot) => !inDressedFamily(slot) && !dressed.has(slot));
    const families = [...new Set(debt.map((slot) => familyOf(slot)))];

    console.info(
      `долг одевания: ${debt.length} зацепок` +
        (debt.length ? `, семейства: ${families.join(", ")}` : ""),
    );

    // Утверждение здесь одно и оно про целостность самого подсчёта: в долг не должно попасть
    // то, что уже одето.
    expect(debt.filter((slot) => dressed.has(slot))).toEqual([]);
  });
});
