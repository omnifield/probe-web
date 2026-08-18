// ГЕНЕРАТОР НАБОРА ЗНАЧКОВ: набор Lucide → `src/skin/icons.css`.
//
// Запуск: `pnpm run build:icons`. Результат лежит В РЕПОЗИТОРИИ и сверяется пробой с моделью:
// расхождение — красный прогон с указанием перегенерировать. Причина та же, что у пресетов:
// потребителю нужен готовый файл, а не наш генератор, но правка модели не должна тихо
// расходиться с тем, что лежит в поставке.
//
// ПОЧЕМУ СВОЙ ГЕНЕРАТОР, А НЕ `getIconsCSS` из `@iconify/utils`. Тот выпускает готовые правила,
// а нам нужна форма с ПЕРЕМЕННОЙ: `--icon-check` объявляется один раз, `[data-icon="check"]`
// её берёт, и то же самое может сделать потребитель — переопределить переменную, не зная наших
// селекторов, или указать свою картинку. Ради этой формы генератор здесь на тридцать строк,
// а зависимость на одну меньше.

import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CORE, KIT_GLYPHS, TRIGGER_MARKS } from "../src/icons/core.ts";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Набор целиком: имя → тело SVG, плюс сетка и лицензия. */
async function loadSet() {
  const path = require.resolve("@iconify-json/lucide/icons.json");
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * Значок как `url(...)` с картинкой внутри.
 *
 * Кодируется процентами, а не base64: так значок остаётся ЧИТАЕМЫМ в файле — видно, что это
 * контур, а не бинарный ком, и правку можно найти глазами. Кавычки внутри картинки одинарные:
 * значение целиком стоит в двойных.
 */
function urlOf(body, width, height) {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const set = await loadSet();
const width = set.width ?? 24;
const height = set.height ?? 24;

const missing = CORE.filter((icon) => !set.icons[icon.name]);
if (missing.length > 0) {
  throw new Error(`нет в наборе Lucide: ${missing.map((i) => i.name).join(", ")}`);
}

const wired = [...Object.values(KIT_GLYPHS), ...Object.values(TRIGGER_MARKS)];
const unknown = wired.filter((name) => !CORE.some((icon) => icon.name === name));
if (unknown.length > 0) {
  throw new Error(`значок навешен на узел, но его нет в ядре: ${unknown.join(", ")}`);
}

const tokens = CORE.map((icon) => {
  const body = set.icons[icon.name].body;
  return `  /* ${icon.why} */\n  --icon-${icon.name}: ${urlOf(body, width, height)};`;
}).join("\n");

const names = CORE.map((icon) => `  [data-icon="${icon.name}"] { --icon: var(--icon-${icon.name}); }`)
  .join("\n");

const kitGlyphs = Object.entries(KIT_GLYPHS)
  .map(
    ([slot, icon]) => `  [data-slot~="${slot}"]:not(:has(*)) {
    --icon: var(--icon-${icon});

    /* Глиф кита уезжает за край и не рисуется, а метрики шрифта остаются — на них держится
       размер \`1em\`. \`display: none\` для текста тут не годится: скрывать надо ТЕКСТ, а сам
       узел обязан остаться видимым, он и есть значок. */
    overflow: hidden;
    text-indent: 1.5em;

    background-color: currentColor;
    mask-image: var(--icon);
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
  }`,
  )
  .join("\n\n");

const marks = Object.entries(TRIGGER_MARKS)
  .map(
    ([slot, icon]) => `  [data-slot~="${slot}"]:not(:has([data-icon]))::after {
    content: "";
    flex: none;

    inline-size: 1em;
    block-size: 1em;

    background-color: currentColor;
    mask-image: var(--icon-${icon});
    mask-size: 100% 100%;
    mask-repeat: no-repeat;

    transition: transform var(--motion-fast) var(--ease-out);
  }

  [data-slot~="${slot}"][data-expanded]:not(:has([data-icon]))::after {
    transform: rotate(180deg);
  }`,
  )
  .join("\n\n");

const css = `/* ЗНАЧКИ — подпуть \`@probe-web/skin/icons.css\`. Требует \`base.css\` рядом (объявление слоя).

   СГЕНЕРИРОВАНО: \`pnpm run build:icons\`. Правки руками стирает следующий прогон — правьте
   модель \`src/icons/core.ts\`, там же сказано, почему значок это маска, а не компонент.

   Источник картинок — Lucide (${Object.keys(set.icons).length} значков, сетка ${width}×${height}),
   лицензия ISC: https://lucide.dev · Copyright (c) Lucide Contributors.
   В ядре ${CORE.length} значков; замер веса и правило отбора — в модели.

   ── КАК ПОСТАВИТЬ ЗНАЧОК ──────────────────────────────────────────────────────────────────

       <span data-icon="check" aria-hidden="true"></span>

   \`aria-hidden\` обязателен: значок это картинка без текста, и для чтения вслух он мусор. Если
   значок — ЕДИНСТВЕННОЕ содержимое кнопки, кнопке нужна подпись (\`aria-label\`): WCAG 2.2,
   4.1.2 Name, Role, Value.

   ── КАК ДОБАВИТЬ СВОЙ ─────────────────────────────────────────────────────────────────────

   Своя картинка — одна строка, и она встаёт наравне со встроенными:

       [data-icon="моя-штука"] { --icon: url("/icons/моя-штука.svg"); }

   Заменить встроенный — переопределить переменную, не зная наших селекторов:

       :root { --icon-check: url("/icons/своя-галочка.svg"); }

   Правило потребителя лежит ВНЕ слоя и потому побеждает наше без \`!important\`.

   ── ЧЕГО ЗДЕСЬ НЕТ ────────────────────────────────────────────────────────────────────────

   Цветных и многоцветных значков: маска несёт только форму, цвет приходит от \`currentColor\`.
   Нужен многоцветный — это картинка в разметке, а не значок. */

@layer skin {
  :root {
    /* Пустая маска — фолбэк. БЕЗ НЕЁ неизвестное имя даёт ЗАКРАШЕННЫЙ КВАДРАТ: \`mask-image:
       none\` означает «маски нет», и заливка \`currentColor\` красится целиком. Поймано замером
       на живой странице. */
    --icon-empty: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%2F%3E");

${tokens}
  }

  /* Общее правило значка. Размер в \`1em\` и цвет \`currentColor\` — не украшение формы, а весь
     смысл: значок наследует кегль и роль у того, внутри чего стоит, и отдельных правил под
     каждое место не требует. */
  [data-icon] {
    display: inline-block;
    flex: none;

    inline-size: 1em;
    block-size: 1em;

    /* Оптическая посадка на строку: без этого значок сидит на базовой линии и выглядит
       приподнятым рядом с текстом. */
    vertical-align: -0.125em;

    background-color: currentColor;
    mask-image: var(--icon, var(--icon-empty));
    mask-size: 100% 100%;
    mask-repeat: no-repeat;
  }

${names}

  /* ── глифы кита ──────────────────────────────────────────────────────────────────────── */

${kitGlyphs}

  /* ── значок открывашки ───────────────────────────────────────────────────────────────── */

${marks}

  @media (prefers-reduced-motion: reduce) {
${Object.keys(TRIGGER_MARKS)
  .map((slot) => `    [data-slot~="${slot}"]:not(:has([data-icon]))::after {\n      transition: none;\n    }`)
  .join("\n\n")}
  }
}
`;

await writeFile(join(here, "..", "src", "skin", "icons.css"), css, "utf8");
console.info(`icons.css: ${CORE.length} значков, ${(css.length / 1024).toFixed(1)} КБ`);
