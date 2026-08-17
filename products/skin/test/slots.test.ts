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

/**
 * ОБЕЩАНИЯ, за которые зона цепляется. Источников теперь ДВА, и это не временно.
 *
 * Кит — не единственный, кого мы одеваем: тяжёлые компоненты зоны `tables` пришли к тому же
 * канону (`kb:SKIN-1`) и объявили свой перечень. Механика от этого не изменилась — изменилось
 * только число источников, и проба обязана знать их все: имя, которого нет ни в одном, это
 * опечатка, а не «наверное, чужое».
 *
 * ФОРМЫ РАЗНЫЕ, и это осознанно. Кит держит перечень в `test/slot-list.ts` — файле, который
 * в его поверхность не входит; читаем по пути в репозитории и знаем, что после разъезда зон
 * этот путь исчезнет (заявка киту стоит). `tables` уже отдаёт обещание ДАННЫМИ в поставке
 * (`src/slots.json`, подпуть `./slots.json`) — так и надо, и так читаем.
 */
function promisedSlots(): string[] {
  const kit = readFileSync(join(ZONE, "..", "..", "packages", "ui", "test", "slot-list.ts"), "utf8");
  const fromKit = [...kit.slice(kit.indexOf("PROMISED_SLOTS")).matchAll(/"([a-z-]+)"/g)].map(
    ([, name]) => name,
  );

  const raw = readFileSync(join(ZONE, "..", "tables", "src", "slots.json"), "utf8");
  const parsed = JSON.parse(raw) as { families?: Record<string, unknown> };
  const families = parsed.families ?? {};
  const fromTables = Object.values(families).flatMap((names) =>
    Array.isArray(names) ? names.filter((one): one is string => typeof one === "string") : [],
  );

  return [...fromKit, ...fromTables];
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
 * ЧАСТИ, КОТОРЫЕ ОДЕВАЕТ КИТ, а не мы.
 *
 * Сосед ставит свои имена НА примитивы кита: `data-slot="select table-pager-size-select"`. Узел
 * несёт оба имени, правило кита применяется само — это и есть цепочка зацепок, ради которой она
 * просилась. Своего правила такой части не нужно, и требовать его значило бы писать вид кнопки
 * заново под каждым чужим именем.
 *
 * Адрес даёт сам сосед — `kitBacked` в его обещании. Проверка при этом НЕ ослабляется: если
 * примитив, на котором часть стоит, у нас не одет, часть остаётся голой, и это долг.
 */
function backedByKit(): Map<string, string> {
  const raw = readFileSync(join(ZONE, "..", "tables", "src", "slots.json"), "utf8");
  const parsed = JSON.parse(raw) as { kitBacked?: Record<string, string[]> };
  const out = new Map<string, string>();

  for (const [primitive, slots] of Object.entries(parsed.kitBacked ?? {})) {
    for (const slot of slots) out.set(slot, primitive);
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
  // Тяжёлые компоненты зоны `tables`. Одевается по одному семейству за заход: `filter` и
  // `chart` встанут сюда, когда будут одеты, — до тех пор они честно висят в долге.
  "table",
  "filter",
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
  // Тело таблицы: вид несут строки и ячейки, а сам `tbody` существует ради разметки. Красить его
  // отдельно значило бы завести фон, который перекрывают все строки до единой.
  "table-body": "узел разметки без собственного вида: цвет и границы несут строки и ячейки",

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
      (slot) =>
        inDressedFamily(slot) &&
        !dressed.has(slot) &&
        !(slot in NOT_DRESSED) &&
        // Часть на примитиве кита одета правилом кита — но только если сам примитив у нас одет.
        !(backedByKit().has(slot) && dressed.has(backedByKit().get(slot)!)),
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
