import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { WRITTEN_BASE } from "../src/css/written.js";
import { DENSITY_TOKEN, DERIVED_TOKENS, FIXED_TOKENS } from "../src/dimension.js";
import { SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";

// Инвариант base.css машиной, а не обещанием в шапке файла: базовый слой обязан
// РЕФЕРЕНСИТЬ тему, а не подменять её. Литеральный цвет здесь не переключается вместе с
// режимом и всплывает светлым пятном в тёмной странице.
//
// Проверяем ПОСТАВЛЯЕМЫЙ файл (`dist/css/base.css`), а не только ручной исходник: он
// собирается из исходника и трёх сгенерированных блоков, и инвариант обязан держаться на
// том, что уезжает потребителю.

// Ручная часть берётся МОДУЛЕМ, а не файлом с диска: она и есть модуль (`PWEB-20`), и
// читать её вторым способом значило бы завести второй ответ на вопрос, что именно написано
// руками.
const source = WRITTEN_BASE;
const built = readFileSync(resolve(import.meta.dirname, "../dist/css/base.css"), "utf8");

/** Тело файла без комментариев — иначе гейт спотыкается о примеры в тексте. */
const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("base.css", () => {
  it("не содержит литеральных цветов — ни в ручной части, ни в сгенерированной", () => {
    for (const [name, css] of [
      ["исходник", source],
      ["поставка", built],
    ] as const) {
      const literals = strip(css).match(/(oklch|rgba?|hsla?)\(|#[0-9a-fA-F]{3,8}\b/g);
      expect(literals, `цвет в базовом слое (${name}) не переключается темой`).toBeNull();
    }
  });

  it("каждый читаемый токен объявлен либо контрактом темы, либо этим же файлом", () => {
    const code = strip(built);
    const declared = new Set(
      [...code.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1].slice(2)),
    );
    const contract = new Set<string>([...SCALE_TOKENS, ...THEME_META_TOKENS]);

    const unknown = [...code.matchAll(/var\((--[\w-]+)/g)]
      .map((match) => match[1].slice(2))
      .filter((token) => !declared.has(token) && !contract.has(token));

    expect([...new Set(unknown)], "ссылка на токен вне контракта").toEqual([]);
  });

  it("не одевает документ: КРОМЕ СБРОСА, своих объявлений в базовом слое нет", () => {
    // Реестр С ДВУХ СТОРОН, а не перечень запрещённого: «нет фона и цвета» устарело бы на
    // первом же новом свойстве, которое кто-нибудь сочтёт безобидным. Здесь сказано «нет
    // НИЧЕГО, кроме вот этих трёх», и любое четвёртое краснеет само.
    //
    // Почему это важнее, чем кажется (`PWEB-39`): из шести прежних объявлений на `body` пять
    // НАСЛЕДОВАЛИСЬ. Одетым оказывался не документ, а кит — кнопка получала цвет текста,
    // шрифт, кегль, высоту строки и трекинг, ничего не спросив, и «нет скина — приложение
    // голое» держалось только на бумаге.
    const declared = [...strip(built).matchAll(/(?:^|[{;])\s*([a-z-]+)\s*:/gm)]
      .map((match) => match[1])
      .filter((property) => !property.startsWith("--"));

    // Разрешённых свойств стало два: `color-scheme` ушёл (`PWEB-61`) — он оказался не
    // объявлением способности, а решением о виде, отданным браузеру.
    expect([...new Set(declared)].sort()).toEqual(["box-sizing", "margin"]);
  });

  it("режима базовый слой не называет ВООБЩЕ — ни конкретного, ни способности", () => {
    // `color-scheme: light dark` стоял здесь как «объявление способности»: страница умеет обе,
    // следуй за человеком; браузер, мол, рисует своё и без нас (`PWEB-50`).
    //
    // Вторая половина оказалась неверной, и показал это живой браузер: БЕЗ нашей строки
    // браузер отвечает `normal` и рисует светлое при любой настройке. Следование за системой
    // бралось из нашего объявления, то есть строка была решением о виде, просто отданным
    // браузеру, — и голая страница показывала два разных вида вместо отсутствия вида.
    //
    // Отсюда негатив на само имя свойства, а не на его значение: вернётся любое, вернётся и
    // выбор.
    const code = strip(built);
    expect(code, "базовый слой снова называет режим").not.toContain("color-scheme");
    expect(code, "класс режима адресуется базовым слоем").not.toContain(".dark");
  });

  it("сброс остаётся: он снимает решения браузера, а не вносит наши", () => {
    // Граница между сбросом и одеждой проверяемая, а не на вкус: сброс ничего не наследует и
    // не приносит ни одного нашего значения.
    expect(strip(built)).toContain("box-sizing: border-box;");
    expect(strip(built)).toMatch(/body\s*{\s*margin:\s*0;\s*}/);
  });

  it("везёт все производные ступени", () => {
    // Поставка собирается генератором: если блок не доехал, потребитель получит `base.css`
    // без половины контракта и узнает об этом по несработавшему `var()`.
    for (const token of [...DERIVED_TOKENS, ...FIXED_TOKENS.map((item) => item.name)]) {
      expect(built, `токен --${token} не доехал в поставку`).toContain(`--${token}:`);
    }
  });

  it("шкалы производны от семени, а не выписаны значениями", () => {
    expect(built).toContain("--radius-lg: var(--radius, 0.5rem);");
    expect(built).toMatch(/--radius-xl:\s*calc\(var\(--radius, 0\.5rem\) \+ 4px\)/);
    expect(built).toMatch(
      /--space-4:\s*round\(nearest, calc\(var\(--space, 0\.25rem\) \* 4 \* var\(--density, 1\)\), 0\.25rem\);/,
    );
  });

  it("у плотной шкалы в поставке два объявления, и подстраховка стоит первой", () => {
    // Порядок проверяется на СОБРАННОМ файле, а не только на генераторе: между блоками в
    // `base.css` приклеиваются другие куски, и переехавший блок сломал бы решение молча.
    // Браузер без `round()` берёт первое объявление, с поддержкой — второе, потому что
    // `@supports` специфичности не добавляет (`tasker:PROBEWEB-63`).
    const plain = built.indexOf("--space-4: calc(var(--space, 0.25rem) * 4 * var(--density, 1));");
    const guard = built.indexOf("@supports (width: round(nearest, 1rem, 0.25rem)) {");
    const snapped = built.indexOf(
      "--space-4: round(nearest, calc(var(--space, 0.25rem) * 4 * var(--density, 1)), 0.25rem);",
    );

    expect(plain, "первого объявления --space-4 в поставке нет").toBeGreaterThan(-1);
    expect(guard, "блока @supports в поставке нет").toBeGreaterThan(plain);
    expect(snapped, "посадка на сетку стоит раньше подстраховки").toBeGreaterThan(guard);
  });

  it("подстраховка накрывает ровно плотные шкалы, а кегль в неё не попадает", () => {
    // Кегль на сетку не садится вовсе — значит и второго объявления у него быть не может.
    const guard = built.slice(built.indexOf("@supports (width: round("));
    for (const token of ["space-4", "column-40", "control-height-sm"]) {
      expect(guard, `--${token} не подстрахован`).toContain(`--${token}: round(nearest,`);
    }
    expect(guard, "кегль попал под @supports").not.toContain("--font-size-");
    expect(guard, "скругление попало под @supports").not.toContain("--radius-");
  });

  it("в поставке нет ни одного старого имени ступени интервалов", () => {
    // Реестр с двух сторон: всё объявленное шкалой доехало (проба выше) — и в файле нет
    // ничего сверх неё. Без второй стороны переименование прошло бы «зелёным» с обоими
    // наборами имён сразу, а потребитель цепляется как раз за имена.
    const declared = [...strip(built).matchAll(/^\s*--(space-[\w-]+):/gm)].map(
      (match) => match[1],
    );
    const expected = DERIVED_TOKENS.filter((token) => token.startsWith("space-"));

    // Имя интервала объявлено ДВАЖДЫ — подстраховка и посадка на сетку (`PROBEWEB-63`), —
    // поэтому реестр сверяется по именам, а число объявлений проверяется отдельно: иначе
    // третье объявление, взявшееся неизвестно откуда, прошло бы незамеченным.
    expect([...new Set(declared)].sort()).toEqual([...expected].sort());
    expect(declared.length, "у ступени интервалов не ровно два объявления").toBe(
      expected.length * 2,
    );
    // Порядковые имена значили ДРУГИЕ кратности (`--space-5` был множителем 6): останься
    // такое имя в файле — потребитель получил бы прежнее имя с новым значением.
    for (const stale of ["space-5", "space-7", "space-9", "space-10"]) {
      expect(declared, `старое имя --${stale} в поставке`).not.toContain(stale);
    }
  });

  it("ось плотности объявлена и умножает то, что должна, включая кегль", () => {
    expect(built).toContain(`--${DENSITY_TOKEN}: 1;`);
    // Кегль в оси: плотность — равномерное изменение всей вещи (`kb:PROBEWEB-16`, часть А).
    const fontSize = built.match(/--font-size-lg:[^;]+;/)?.[0] ?? "";
    expect(fontSize).toContain(DENSITY_TOKEN);
    // …но на сетку он не садится — шаг сетки разрушил бы отношения ступеней (`GRID_NOTE`).
    expect(fontSize).not.toContain("round(");
    // Геометрия, наоборот, садится: иначе произвольный множитель даёт дробь.
    expect(built).toMatch(/--control-height-sm:\s*round\(nearest,/);
  });

  it("семантических ролей и устаревших имён в поставке нет ни одного", () => {
    // Их было 63: 35 ролей (`--surface`, `--text`, `--focus-ring`…) и 28 имён прежнего набора
    // (`--primary`, `--card`, восемь `--sidebar-*`). Ушли не потому, что ссылались в пустоту,
    // хотя ссылались, — а потому что «фон приложения это первая нейтральная ступень» есть
    // чужая система вкуса, отгруженная фреймворком (`PWEB-61`).
    //
    // Перечень здесь ОБРАЗЦОВЫЙ, и это честно: полный перечень уехал вместе с исходником, а
    // держать его копию тут значило бы вернуть снятое в виде проб. Настоящий гейт — соседний,
    // «ни одной ссылки на несуществующую ступень»: он ловит любое имя, а не названные.
    // Комментарии вырезаны намеренно: шапка порождённого файла НАЗЫВАЕТ снятые имена, объясняя,
    // почему их нет. Проверять надо объявления, а не рассказ о них — иначе объяснение само себя
    // и красит.
    const code = strip(built);
    for (const gone of ["surface", "text", "focus-ring", "brand-solid", "danger-solid",
                        "primary", "card", "muted", "destructive", "input", "ring"]) {
      expect(code, `--${gone} вернулся в базовый слой`).not.toContain(`--${gone}:`);
    }
    expect(code, "семейство --sidebar-* вернулось").not.toContain("--sidebar");
  });

  it("в поставке не осталось ни одной ссылки на несуществующую ступень", () => {
    // Главный гейт снятия. Роли и псевдонимы были ПРОВОДКОЙ к ступеням, которых в поставке
    // нет с тех пор, как снята палитра: `var(--neutral-1)` не разрешался ни во что. Проверяем
    // не «этих имён нет», а «ничто не ссылается в пустоту» — так гейт переживёт любое новое
    // имя, которое кто-нибудь заведёт с той же ошибкой.
    const code = strip(built);
    const declared = new Set(
      [...code.matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((match) => match[1].slice(2)),
    );
    // Семена размерных шкал приходят от того, кто ставит вид, и у каждого в базе объявлен
    // дефолт прямо в `var(--семя, …)` — такая ссылка разрешается всегда.
    const withFallback = new Set(
      [...code.matchAll(/var\(\s*(--[\w-]+)\s*,/g)].map((match) => match[1].slice(2)),
    );

    const dangling = [...code.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)]
      .map((match) => match[1].slice(2))
      .filter((token) => !declared.has(token) && !withFallback.has(token));

    expect([...new Set(dangling)], "ссылка на ступень, которой в поставке нет").toEqual([]);
  });
});
