import { beforeEach, describe, expect, it } from "vitest";

import { PALETTE_ATTRIBUTE } from "../src/palette.js";
import { readBuilt } from "./helpers/css.js";
import { PALETTE, paletteFile } from "./helpers/seeds.js";

// ГЕЙТ «РЕЖИМ ПРИНАДЛЕЖИТ СКИНУ» (`PWEB-50`, `PWEB-61`). Мерим ЖИВЫМ ДОКУМЕНТОМ, а не чтением
// файла: вопрос — «меняется ли хоть одно значение», а на него отвечает каскад, а не текст.
// Чтение поймало бы отсутствие блока `.dark` и не поймало бы, скажем, значение, приехавшее
// через `@media` или наследование.
//
// Документ здесь настоящий: таблица стилей та, что уезжает потребителю (`dist/css/base.css`),
// класс режима ставится на корень, значения снимаются `getComputedStyle`.
//
// ПРЕДЕЛ ЭТОГО ГЕЙТА НАЗВАН, а не обойдён. jsdom не рисует системных элементов и не отвечает
// за холст, поэтому «страница выглядит одинаково при обеих настройках СИСТЕМЫ» здесь не
// проверяется — это вопрос к живому браузеру, обвязка в `tools/live-check/`, и след замера
// живёт в узле задачи. Здесь проверяется то, что jsdom знает точно: класс режима и объявление
// на корне.

const base = readBuilt("base.css");

/** Имена всех кастом-свойств, объявленных таблицей. Проверяем ВСЕ, а не выбранные. */
const declaredIn = (css: string): string[] => [
  ...new Set(
    [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/^\s*(--[\w-]+)\s*:/gm)].map(
      (match) => match[1],
    ),
  ),
];

const DECLARED = declaredIn(base);

/**
 * Снимок вычисленных значений корня: объявление режима плюс перечисленные свойства.
 *
 * Имена передаются, а не берутся из одного файла: документ в пробе бывает и голым, и с надетой
 * палитрой, и во втором случае двигаются ЕЁ имена — ступени, — а не имена базы.
 *
 * ПРЕДЕЛ ИНСТРУМЕНТА НАЗВАН: jsdom не разрешает `var()` внутри кастом-свойства — `--surface`
 * он отдаёт как `var(--neutral-1)`, а не как значение ступени. Для этого гейта хватает: он
 * спрашивает, ДВИНУЛОСЬ ли хоть что-то от класса режима, а объявление, зависящее от класса,
 * двигает саму запись. Разрешение цепочки проверено отдельно, живым браузером, и записано в
 * узле задачи.
 */
function snapshot(names: readonly string[]): Record<string, string> {
  const computed = getComputedStyle(document.documentElement);
  const shot: Record<string, string> = {
    "color-scheme": computed.getPropertyValue("color-scheme").trim(),
  };
  for (const name of names) shot[name] = computed.getPropertyValue(name).trim();
  return shot;
}

function styleSheet(css: string): void {
  const tag = document.createElement("style");
  tag.textContent = css;
  document.head.append(tag);
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute(PALETTE_ATTRIBUTE);
});

describe("приложение БЕЗ скина", () => {
  beforeEach(() => {
    styleSheet(base);
  });

  it("базовый слой не объявляет режима вовсе — ни конкретного, ни способности", () => {
    // Было `light dark` и объяснялось «способностью»: страница умеет обе, следуй за человеком.
    // Живой браузер показал, что вторая половина объяснения неверна — без объявления он
    // отвечает `normal` и рисует светлое при любой настройке, то есть следование за системой
    // бралось из НАШЕЙ строки. Значит это было решение о виде, а решение о виде — скину.
    //
    // `normal` — ответ браузера по умолчанию, то есть ровно «мы ничего не сказали».
    expect(getComputedStyle(document.documentElement).getPropertyValue("color-scheme").trim()).toBe(
      "normal",
    );
  });

  it("переключение режима не меняет НИ ОДНОГО значения", () => {
    // Главный гейт задачи. Раньше менялись два: объявление режима браузеру и тёмная пара ролей
    // из поставляемой палитры. Первое ушло в способность, второй нет вовсе — палитра без
    // рецептов это половина скина, а половин у скина не бывает.
    expect(DECLARED.length, "базовый слой не объявил ни одного свойства — снимок пустой").
      toBeGreaterThan(20);

    const light = snapshot(DECLARED);
    document.documentElement.classList.add("dark");
    const dark = snapshot(DECLARED);

    const moved = Object.keys(light).filter((name) => light[name] !== dark[name]);
    expect(moved, "значение поехало за классом режима на голом приложении").toEqual([]);
  });

  it("класс режима базовому слою вообще не адресуем", () => {
    // Вторая сторона того же, и она про КАСКАД, а не про сегодняшний текст файла: правило с
    // классом можно вернуть так, что снимок выше не заметит, — например объявив свойство,
    // которого в светлой половине нет. Здесь спрашивается сам документ.
    document.documentElement.classList.add("dark");
    const withClass = snapshot(DECLARED);
    document.documentElement.classList.remove("dark");
    const without = snapshot(DECLARED);

    expect(withClass).toEqual(without);
  });
});

const PALETTE_NAMES = declaredIn(paletteFile());

describe("положительный контроль: палитра надета", () => {
  // Без этой половины «ничего не меняется» значило бы и «режим больше не при чём», и «замер
  // не умеет замечать изменения». Берём палитру-фикстуру — ту самую, которую зона умеет
  // порождать, — и убеждаемся, что на ней режим ДЕЙСТВУЕТ.
  beforeEach(() => {
    styleSheet(base);
    styleSheet(paletteFile());
    document.documentElement.setAttribute(PALETTE_ATTRIBUTE, PALETTE);
  });

  it("с палитрой режим меняет значения — значит замер выше меряет, а не молчит", () => {
    const light = snapshot(PALETTE_NAMES);
    document.documentElement.classList.add("dark");
    const dark = snapshot(PALETTE_NAMES);

    const moved = Object.keys(light).filter((name) => light[name] !== dark[name]);
    expect(moved.length, "палитра надета, а режим ничего не изменил — замер слеп").
      toBeGreaterThan(10);
  });

  it("а надета она ТОЛЬКО по имени: без атрибута палитры режим снова ничего не меняет", () => {
    // То же различение, что держит `palette.test.ts`, но с этой стороны: палитра действует по
    // имени, и снятие имени возвращает документ к голому состоянию вместе с режимом.
    document.documentElement.removeAttribute(PALETTE_ATTRIBUTE);

    const light = snapshot([...DECLARED, ...PALETTE_NAMES]);
    document.documentElement.classList.add("dark");
    const dark = snapshot([...DECLARED, ...PALETTE_NAMES]);

    expect(Object.keys(light).filter((name) => light[name] !== dark[name])).toEqual([]);
  });
});
