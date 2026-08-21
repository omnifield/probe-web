// ЧИТАЕМОСТЬ — считает механика, отдаёт значением.
//
// ## Почему это здесь, а не в каждом пульте
//
// На странице «Скин» записано прямо: свобода значения означает, что скин может быть плохим, и
// проверки читаемости должны стоять на уровне скина. Довод тот же, которым сюда вынесено
// непокрытое, — и он уже сработал: такая проверка была написана скриптом на стороне, то есть
// второй ответ на один вопрос уже существовал. У следующего пульта был бы третий.
//
// ## Формула не наша, и своей быть не может
//
// `contrastRatio` берётся у зоны значений, где она объявлена ГЕЙТОМ: «тот, кто ставит свой
// бренд, обязан уметь проверить обещание на своих значениях ТОЙ ЖЕ формулой, которой проверяем
// мы; иначе „проверено“ у него и у нас означает разное». Написать её здесь второй раз — ровно
// то, от чего это правило защищает.
//
// Оттуда же пороги: 4.5 для текста (WCAG 2.2, критерий 1.4.3) и 3 для нетекстового (1.4.11).
//
// Отсюда цена: зона зависит на набор значений ОДНОРАНГОВО, и этот вход живёт только в корневом
// подпути — `./model` остаётся без него (`PWEB-36`, правило «делит их то, что попадёт в сборку»).
// Речь при этом не о токенах: словарь имён по-прежнему приходит снаружи, и скин на чужих
// значениях остаётся законным. Взята одна формула, а не наш набор.
//
// ## Не запрещаем
//
// Ответ — перечень, а не отказ. Скин вправе быть плохим, но не молча: механика сообщает, решает
// потребитель. Витрина показывает в своём окне, хранилище может отказаться сохранить, проба
// проверяет именно этот изъян.
//
// ## Что считается парой
//
// Пара — это передний план и заливка НА ОДНОЙ координате, сложенные по каскаду. Складывать
// приходится, потому что в жизни они приходят из разных мест: цвет текста объявлен базой, а
// заливка вариацией, и правило, глядящее на одну запись, такую пару не увидит вовсе. Именно так
// и выглядел случай, с которого задача началась.
//
// Порог зависит от того, чем пара является: цвет текста на заливке — одна норма, граница или
// значок на фоне — другая. Один порог на всё либо пропустил бы плохое, либо забраковал хорошее.
//
// ## Честные пределы, каждый назван
//
//   • **считаются только объявленные координаты.** Сочетания, которых скин не адресует (скажем,
//     «опасная и при этом наведённая», если такого правила нет), не перебираются: их
//     произведение растёт как попало, а ответ должен быть про запись, а не про воображаемое;
//   • **складываются только объявления верхнего уровня.** Значение внутри `@media` или
//     псевдоэлемента в пару не идёт — оно действует не всегда, и «посчитать» его значило бы
//     соврать в одну из сторон;
//   • **пара, которую посчитать нечем, НАЗЫВАЕТСЯ.** Прозрачная заливка, ссылка на имя вне
//     скина, значение, которого формула не разбирает, — всё это отдельный вид ответа, а не
//     молчание. Молчание здесь неотличимо от «всё хорошо».
//
// ## Цвет ли это — спрашивается ВЕТВЛЕНИЕМ, а не перехватом отказа
//
// Раньше механика узнавала цвет, пробуя посчитать контраст и ловя исключение: разбор умел только
// бросать, и другого способа не было. Теперь зона значений отдаёт не бросающий `tryParseColor`, и
// отказ приходит значением с НАЗВАННОЙ причиной.
//
// Разница не косметическая. Причин две, и чинятся они разным: полупрозрачное значение понято, но
// контраст на нём не считается, пока не названа заливка под ним; неразобранная запись — опечатка
// или незнакомая форма. Перехватом они неразличимы, и человека посылало искать ошибку там, где
// надо назвать фон.
//
// Причина доносится до записи целиком, вместе с пояснением от разбора: пересказывать его своими
// словами значило бы завести второй текст об одном и том же (`PWEB-45`).

import {
  AA_NON_TEXT,
  AA_TEXT,
  contrastRatio,
  tryParseColor,
  type ColorRefusal,
  type Oklch,
  type ParsedColor,
} from "@omnifield/probe-web-style/values";
import type { ComponentPassport } from "@omnifield/probe-web-ui/passport";

import { passportLookup } from "./address.js";
import { cssProperty } from "./property.js";
import type { Skin, StyleObject } from "./recipe.js";
import { skinValues, type SkinHalf } from "./seeds.js";
import { skinRules, type RuleCoordinate, type SkinRule } from "./rules.js";
import { trace } from "./trace.js";

/** Норма, по которой считали пару. */
export type ContrastNorm = "text" | "non-text";

/**
 * Почему пару посчитать нечем.
 *
 *  • `no-background`    — заливки на этой координате нет вовсе: что под текстом, скин не говорит;
 *  • `outside-skin`     — значение приходит извне скина: ссылка на имя, которого в скине нет,
 *                         либо ключевое слово CSS, отсылающее наружу (`inherit`, `currentColor`);
 *  • `translucent`      — запись понята, но цвет полупрозрачен: контраст зависит от того, что под
 *                         ним, и считать его не с чем, пока заливка не названа;
 *  • `unknown-notation` — запись не разобрана: опечатка или незнакомая форма.
 *
 * Последние две — РАЗНЫЕ причины, потому что чинятся разным. Слепи их в «не цвет», и человек
 * пойдёт искать опечатку там, где надо назвать заливку под текстом. Имена взяты у разбора
 * (`ColorRefusal`): перевод чужих имён в свои — второй словарь об одном и том же.
 */
export type UnreckonableReason = "no-background" | "outside-skin" | ColorRefusal;

/** Адрес, на котором сошлась пара. Пустая вариация — «без вариации», как у базы. */
export type ContrastAddress = Pick<RuleCoordinate, "component" | "part" | "variants" | "states">;

/**
 * Одна запись ответа.
 *
 * Размеченное объединение: у непосчитанной пары нет ни отношения, ни нормы-числа, и
 * необязательные поля заставляли бы читателя гадать, значит ли `undefined` «не считали» или
 * «получилось ноль».
 */
export type ContrastNote =
  | {
      readonly kind: "low";
      readonly half: SkinHalf;
      readonly where: ContrastAddress;
      /** Свойство переднего плана: `color`, `border-color`… */
      readonly property: string;
      readonly norm: ContrastNorm;
      /** Разрешённые значения — те, по которым считали. */
      readonly foreground: string;
      readonly background: string;
      /** Посчитанное отношение, округлённое до сотых. */
      readonly ratio: number;
      /** Порог нормы. */
      readonly required: number;
      readonly means: string;
    }
  | {
      readonly kind: "unreckonable";
      readonly half: SkinHalf;
      readonly where: ContrastAddress;
      readonly property: string;
      readonly norm: ContrastNorm;
      readonly reason: UnreckonableReason;
      readonly means: string;
    };

/** Свойства заливки. Длинное имя перебивает короткое: оно точнее. */
const BACKGROUND = ["background-color", "background"];

/** Свойства переднего плана и норма, по которой их считают. */
const FOREGROUND: readonly (readonly [property: string, norm: ContrastNorm])[] = [
  ["color", "text"],
  ["border-color", "non-text"],
  ["outline-color", "non-text"],
  ["fill", "non-text"],
  ["stroke", "non-text"],
];

/**
 * Ключевые слова CSS, отсылающие ЗА ПРЕДЕЛЫ этой координаты.
 *
 * Цветовыми записями они не являются вовсе, и спрашивать о них разбор бессмысленно: он честно
 * ответит «не разобрано», а это неправда — тут не опечатка, а отсылка наружу. Своего разбора
 * цвета здесь нет: перечень короткий, закрытый и про синтаксис CSS, а не про цвет.
 *
 * `transparent` сюда НЕ входит: это настоящая цветовая запись, и разбор называет её
 * полупрозрачной — точнее, чем смогли бы мы.
 */
const OUTSIDE = new Set(["none", "inherit", "currentcolor", "unset", "initial", "revert"]);

/** Предел раскрутки ссылок: переменная, ссылающаяся сама на себя, не должна вешать счёт. */
const DEPTH = 16;

/** Ищет закрывающую скобку для открывающей на позиции `open`. */
function closing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Делит содержимое `var(…)` на имя и запасное значение по ПЕРВОЙ запятой верхнего уровня. */
function splitReference(inside: string): { name: string; fallback?: string } {
  let depth = 0;
  for (let i = 0; i < inside.length; i += 1) {
    if (inside[i] === "(") depth += 1;
    else if (inside[i] === ")") depth -= 1;
    else if (inside[i] === "," && depth === 0) {
      return { name: inside.slice(0, i).trim(), fallback: inside.slice(i + 1).trim() };
    }
  }
  return { name: inside.trim() };
}

/**
 * Раскручивает ссылки на значения скина.
 *
 * Ссылка — это `var(--имя)`, как и всюду в зоне. Имя, которого в скине нет, но у которого назван
 * запасной, разрешается запасным: автор прямо сказал, что будет без имени. Имя без запасного —
 * значение приходит извне скина, и посчитать пару нечем.
 *
 * @returns разрешённое значение либо `undefined` — если раскрутить нечем
 */
function resolve(value: string, values: Map<string, { value: string }>, depth = 0): string | undefined {
  if (depth > DEPTH) return undefined;

  const open = value.indexOf("var(");
  if (open < 0) return value;

  const paren = open + 3;
  const end = closing(value, paren);
  if (end < 0) return undefined;

  const { name, fallback } = splitReference(value.slice(paren + 1, end));
  const own = values.get(name.startsWith("--") ? name.slice(2) : name)?.value;
  const replacement = own ?? fallback;

  if (replacement === undefined) return undefined;

  return resolve(
    `${value.slice(0, open)}${replacement}${value.slice(end + 1)}`,
    values,
    depth + 1,
  );
}

/** Куски значения верхнего уровня: `1px solid #334455` → три, `oklch(0.2 0 0)` → один. */
function pieces(value: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "(") depth += 1;
    else if (value[i] === ")") depth -= 1;
    // Режем по пробелам ВЕРХНЕГО уровня — иначе `oklch(0.2 0 0)` развалился бы на три
    // бессмысленных куска.
    else if (value[i] === " " && depth === 0) {
      found.push(value.slice(start, i));
      start = i + 1;
    }
  }
  found.push(value.slice(start));

  return found.filter(Boolean);
}

/**
 * Цвет из значения — ветвлением по ответу разбора, без единого перехвата.
 *
 * Пробует значение целиком, затем его куски с конца: у составного значения (`1px solid #334455`)
 * цвет стоит отдельным куском, и стоит он последним.
 *
 * Если цвета не нашлось, отдаётся ПРИЧИНА, и полупрозрачность имеет приоритет над «не разобрано»:
 * в `1px solid rgba(0 0 0 / 50%)` целое действительно не разбирается, но человеку чинить надо не
 * это. Причина берётся у разбора вместе с его пояснением.
 */
function colourOf(value: string): (ParsedColor & { ok: false }) | { ok: true; color: Oklch; text: string } {
  const trimmed = value.trim();
  const whole = tryParseColor(trimmed);

  if (whole.ok) return { ok: true, color: whole.color, text: trimmed };

  let refusal = whole;

  for (const piece of pieces(trimmed).reverse()) {
    const parsed = tryParseColor(piece);

    if (parsed.ok) return { ok: true, color: parsed.color, text: piece };
    if (parsed.refusal === "translucent") refusal = parsed;
  }

  return refusal;
}

/** Применимо ли правило к адресу: тот же компонент и часть, вариация и состояния — подмножеством. */
function applies(rule: SkinRule, at: ContrastAddress, fallbackVariant: string | undefined): boolean {
  const { coordinate } = rule;

  if (coordinate.component !== at.component || coordinate.part !== at.part) return false;
  // Предок в правиле — условие снаружи узла. Правило от предка складывается только с адресом,
  // который этого же предка называет; иначе мы сложили бы вид, действующий не всегда.
  if (coordinate.ancestor) return false;

  if (coordinate.variants.length > 0) {
    const named = at.variants.length > 0
      ? at.variants.some((variant) => coordinate.variants.includes(variant))
      // Голый узел — тот, на котором атрибута нет. На него действует умолчание: селектор
      // умолчания адресует и отсутствие атрибута тоже.
      : fallbackVariant !== undefined && coordinate.variants.includes(fallbackVariant);
    if (!named) return false;
  }

  return coordinate.states.every((state) => at.states.includes(state));
}

/** Ключ части: по нему правила разложены заранее, чтобы складывать не весь скин на каждый адрес. */
function partOfKey(coordinate: Pick<RuleCoordinate, "component" | "part">): string {
  return `${coordinate.component}.${coordinate.part}`;
}

/**
 * Раскладывает правила по частям.
 *
 * Без этого складывание было бы квадратичным по всему скину: на каждый адрес — обход всех правил
 * кита. Складывать имеет смысл только правила ТОЙ ЖЕ части, а их у части единицы.
 */
function byPart(rules: readonly SkinRule[]): Map<string, SkinRule[]> {
  const groups = new Map<string, SkinRule[]>();

  for (const rule of rules) {
    const key = partOfKey(rule.coordinate);
    const kin = groups.get(key);
    if (kin) kin.push(rule);
    else groups.set(key, [rule]);
  }

  return groups;
}

/** Складывает объявления верхнего уровня по каскаду: правила уже стоят в нужном порядке. */
function foldedAt(
  rules: readonly SkinRule[],
  at: ContrastAddress,
  fallbackVariant: string | undefined,
): Map<string, string> {
  const props = new Map<string, string>();

  for (const rule of rules) {
    if (!applies(rule, at, fallbackVariant)) continue;

    for (const [key, value] of Object.entries(rule.style as StyleObject)) {
      if (value === undefined || typeof value === "object") continue;
      props.set(cssProperty(key), String(value));
    }
  }

  return props;
}

/** Ключ, по которому одинаковые пары не повторяются в ответе. */
function pairKey(half: SkinHalf, property: string, front: string, back: string): string {
  return `${half}|${property}|${front}|${back}`;
}

/** Разбирает одно значение до цвета либо называет причину, по которой не вышло. */
function readColour(
  value: string,
  values: Map<string, { value: string }>,
): { colour: Oklch; text: string } | { reason: UnreckonableReason; means: string } {
  const resolved = resolve(value, values);

  if (resolved === undefined) {
    return {
      reason: "outside-skin",
      means: `значение «${value}» ссылается на имя, которого в скине нет`,
    };
  }

  if (OUTSIDE.has(resolved.trim().toLowerCase())) {
    return {
      reason: "outside-skin",
      means: `«${resolved.trim()}» отсылает за пределы этой координаты: чем оно окажется, скин не говорит`,
    };
  }

  const parsed = colourOf(resolved);

  return parsed.ok
    ? { colour: parsed.color, text: parsed.text }
    : { reason: parsed.refusal, means: parsed.means };
}

/**
 * Читаемость скина — перечень пар, которые не проходят норму, и пар, которые посчитать нечем.
 *
 * ```ts
 * import { PASSPORTS } from "@omnifield/probe-web-ui/passport";
 *
 * const notes = skinContrast(skin, Object.values(PASSPORTS));
 * // [{ kind: "low", half: "dark", property: "color", ratio: 3.91, required: 4.5, … }]
 * ```
 *
 * Считаются ОБЕ половины: тёмная поедет непроверенной, если смотреть только светлую.
 *
 * Одинаковая пара не повторяется: если базовый цвет на базовой заливке плох, об этом говорится
 * один раз — на том адресе, где пара встретилась впервые, — а не на каждом состоянии, которое
 * её унаследовало.
 *
 * @param skin скин целиком
 * @param passports паспорта компонентов, которые скин одевает
 * @returns записи; пустой перечень — все посчитанные пары проходят норму
 */
export function skinContrast(
  skin: Skin,
  passports: Iterable<ComponentPassport>,
): readonly ContrastNote[] {
  const done = trace(`skinContrast(${skin.name})`);

  const { rules } = skinRules(skin, passportLookup(passports));
  const groups = byPart(rules);
  const notes: ContrastNote[] = [];

  for (const half of ["light", "dark"] as const) {
    const values = skinValues(skin, half);
    const seen = new Set<string>();

    for (const rule of rules) {
      const at: ContrastAddress = {
        component: rule.coordinate.component,
        part: rule.coordinate.part,
        variants: rule.coordinate.variants,
        states: rule.coordinate.states,
      };
      const fallbackVariant = skin.recipes[at.component]?.defaultVariant;
      const props = foldedAt(groups.get(partOfKey(at)) ?? [], at, fallbackVariant);

      for (const [property, norm] of FOREGROUND) {
        const front = props.get(property);
        if (front === undefined) continue;

        const back = BACKGROUND.map((name) => props.get(name)).find((v) => v !== undefined);
        const required = norm === "text" ? AA_TEXT : AA_NON_TEXT;

        if (back === undefined) {
          if (seen.has(pairKey(half, property, front, "—"))) continue;
          seen.add(pairKey(half, property, front, "—"));
          notes.push({
            kind: "unreckonable",
            half,
            where: at,
            property,
            norm,
            reason: "no-background",
            means:
              `на координате «${at.component}.${at.part}» объявлен ${property}, а заливки нет: ` +
              "что под ним — скин не говорит, и посчитать пару нечем",
          });
          continue;
        }

        if (seen.has(pairKey(half, property, front, back))) continue;
        seen.add(pairKey(half, property, front, back));

        const first = readColour(front, values);
        const second = readColour(back, values);
        // Причина берётся у того значения, которое её дало, вместе с его пояснением: своими
        // словами пересказывать разбор значило бы завести второй текст об одном и том же.
        const failed = "reason" in first ? first : "reason" in second ? second : undefined;

        if (failed) {
          notes.push({
            kind: "unreckonable",
            half,
            where: at,
            property,
            norm,
            reason: failed.reason,
            means: `${failed.means} (${property}: ${front} на ${back})`,
          });
          continue;
        }

        const foreground = first as { colour: Oklch; text: string };
        const background = second as { colour: Oklch; text: string };
        const ratio =
          Math.round(contrastRatio(foreground.colour, background.colour) * 100) / 100;

        if (ratio >= required) continue;

        notes.push({
          kind: "low",
          half,
          where: at,
          property,
          norm,
          foreground: foreground.text,
          background: background.text,
          ratio,
          required,
          means:
            `${norm === "text" ? "текст" : "нетекстовый элемент"} на координате ` +
            `«${at.component}.${at.part}» даёт ${ratio.toFixed(2)} при норме ${required} ` +
            `(${half === "light" ? "светлая" : "тёмная"} половина)`,
        });
      }
    }
  }

  done();
  return notes;
}
