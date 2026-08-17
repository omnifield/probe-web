// Общая обвязка проб оформления: чтение и разбор собственных CSS-файлов.
//
// Почему пробы читают ИСХОДНИКИ, а не вычисленные стили. У jsdom нет движка каскада: он не
// применяет внешние таблицы стилей и `getComputedStyle` вернёт пустоту вместо нашего значения.
// Проверять вид пикселями — работа снимка в настоящем браузере, и рынок под наши три вопроса
// («обе темы различаются», «кит без оформления жив», forced-colors) готового средства не
// объявляет вовсе (`canons/ui-skin/gaps/hard-visual-proofs.md`).
//
// Поэтому предмет этих проб — не «как выглядит», а ПРАВИЛА ЗОНЫ, которые как раз проверяемы
// текстом: за что цепляемся, откуда берём значения, что лежит в слое. Ровно они и ломаются
// молча.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Корень зоны. */
export const ZONE = join(here, "..");

/** Папка с поставляемым оформлением. */
export const SKIN_DIR = join(ZONE, "src", "skin");

/** Файлы оформления, кроме сборного `skin.css` (в нём только импорты). */
export function skinFiles(): { name: string; text: string }[] {
  return readdirSync(SKIN_DIR)
    .filter((name) => name.endsWith(".css") && name !== "skin.css")
    .sort()
    .map((name) => ({ name, text: readFileSync(join(SKIN_DIR, name), "utf8") }));
}

/** Текст файла оформления по имени. */
export function skinFile(name: string): string {
  return readFileSync(join(SKIN_DIR, name), "utf8");
}

/** Всё оформление одной строкой. */
export function allSkinCss(): string {
  return skinFiles()
    .map((f) => f.text)
    .join("\n");
}

/**
 * Снимает комментарии. Без этого любая проба «по тексту» ловит слова из пояснений: в
 * комментариях у нас и цитаты норм, и примеры вроде `#fff`, и слово `class`.
 */
export function stripComments(css: string): string {
  return css.replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Селекторы правил — то, что стоит перед `{` и не является at-правилом.
 *
 * Разбор нарочно простой: у нас нет вложенности глубже `@layer`/`@media`, и полноценный
 * парсер здесь стоил бы зависимости в пробах ради того же ответа.
 *
 * Запятые делятся ТОЛЬКО на верхнем уровне: внутри `:is(…)`, `:not(…)` и скобок атрибута
 * запятая — часть одного селектора. Наивный `split(",")` разрезал
 * `[data-slot~="button"]:is(:hover, [data-expanded])` пополам, и проба «в селекторе есть
 * зацепка» падала на половинке без неё, то есть на здоровом CSS.
 */
export function selectors(css: string): string[] {
  const out: string[] = [];
  for (const [, head] of stripComments(css).matchAll(/([^{}]+)\{/g)) {
    const text = head.trim();
    if (!text || text.startsWith("@")) continue;
    for (const part of splitTopLevel(text)) {
      const one = part.trim();
      if (one) out.push(one);
    }
  }
  return out;
}

/** Делит список селекторов по запятым вне скобок. */
function splitTopLevel(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let from = 0;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth -= 1;
    else if (char === "," && depth === 0) {
      out.push(text.slice(from, i));
      from = i + 1;
    }
  }

  out.push(text.slice(from));
  return out;
}

/** Объявления `свойство: значение` (без вложенных селекторов и at-правил). */
export function declarations(css: string): { property: string; value: string }[] {
  const out: { property: string; value: string }[] = [];
  for (const [, property, value] of stripComments(css).matchAll(
    /([a-z-]+)\s*:\s*([^;{}]+);/g,
  )) {
    out.push({ property: property.trim(), value: value.trim() });
  }
  return out;
}

/** Имена токенов, которые оформление читает: `var(--x)` → `--x`. */
export function usedTokens(css: string): Set<string> {
  const out = new Set<string>();
  for (const [, name] of stripComments(css).matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    out.add(name);
  }
  return out;
}

/** Папка поставленного слоя `style` — источник, с которым сверяются пробы. */
const STYLE_CSS = join(ZONE, "node_modules", "@omnifield", "probe-web-style", "dist", "css");

/** Тема слоя `style`: значения СТУПЕНЕЙ шкал, своя пара на светлый и тёмный режим. */
export function themesCss(): string {
  return readFileSync(join(STYLE_CSS, "themes.css"), "utf8");
}

/** Базовый слой `style`: РОЛИ, которые ссылаются на ступени, и производные размерные шкалы. */
export function styleBaseCss(): string {
  return readFileSync(join(STYLE_CSS, "base.css"), "utf8");
}

/**
 * Роли базового слоя: `--brand-solid` → `--brand-9`.
 *
 * Роль хранит не цвет, а ссылку на ступень — поэтому значение любого нашего токена находится
 * только проходом по цепочке до ступени и уже оттуда в тему.
 */
export function roleLinks(): Map<string, string> {
  const links = new Map<string, string>();
  for (const [, name, value] of stripComments(styleBaseCss()).matchAll(
    /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi,
  )) {
    links.set(name, value.trim());
  }
  return links;
}

/**
 * Имена, объявленные базой УСТАРЕВШИМИ. Читаются из самой базы, а не переписываются сюда:
 * список живёт у владельца слоя и будет меняться, а вторая копия разъедется молча.
 */
export function deprecatedTokens(): Set<string> {
  // Маркер живёт в КОММЕНТАРИИ базы, поэтому ищем его до снятия комментариев — иначе от
  // заголовка блока не остаётся следа и список молча выходит пустым.
  const css = styleBaseCss();
  const marker = css.indexOf("УСТАРЕВШИЕ");
  if (marker < 0) return new Set();

  const tail = stripComments(css.slice(marker));
  const out = new Set<string>();
  for (const [, name] of tail.matchAll(/(--[a-z0-9-]+)\s*:/gi)) out.add(name);
  return out;
}

/**
 * Значение токена в заданном режиме — по цепочке роль → … → ступень → значение темы.
 *
 * @returns значение или `undefined`, если цепочка никуда не привела
 */
export function resolveToken(name: string, mode: ":root" | ".dark"): string | undefined {
  const steps = mode === ":root" ? themeValues(":root") : themeValues(".dark");
  const roles = roleLinks();

  let current = name;
  // Глубина цепочки у базы небольшая (роль → ступень), запас на случай псевдонима роли.
  for (let hop = 0; hop < 8; hop += 1) {
    const direct = steps.get(current);
    if (direct) return direct;

    const link = roles.get(current);
    if (!link) return undefined;

    const next = /var\(\s*(--[a-z0-9-]+)/i.exec(link)?.[1];
    if (!next) return link; // не ссылка, а собственное значение роли
    current = next;
  }

  return undefined;
}

/**
 * Значения токенов в одном блоке темы.
 *
 * @param selector селектор блока — `:root` для светлой пары, `.dark` для тёмной
 */
export function themeValues(selector: string): Map<string, string> {
  const css = stripComments(themesCss());
  const values = new Map<string, string>();

  // Блоков с одним и тем же селектором может быть несколько; берём все по очереди, поздний
  // выигрывает — так же, как это сделает браузер.
  for (const [, head, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const heads = head.split(",").map((h) => h.trim());
    if (!heads.includes(selector)) continue;
    for (const [, name, value] of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      values.set(name, value.trim());
    }
  }

  return values;
}
