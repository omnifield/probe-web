// ПОКРЫТИЕ — ответ на вопрос «чего скин ещё не одел».
//
// ## Почему это здесь, а не в каждом пульте
//
// Ответ выводится из паспортов и записи скина — то есть из двух вещей, которыми владеет эта
// зона. Напиши его витрина у себя, редактор напишет второй, хранилище третий, и три ответа на
// один вопрос разойдутся: у одного «часть не одета» будет значить одно, у другого другое, и
// узнается это в тот день, когда они покажут разное про один и тот же скин.
//
// Тот же довод, которым правило допуска вынесено к форме паспорта, а перечень компонентов — в
// реестр.
//
// ## Ответ — ЗНАЧЕНИЕ, а не строка в консоли
//
// У ответа три разных потребителя, и ни одному из них консоль не годится: витрине надо показать
// это в своём окне, хранилищу — отказаться сохранить неполный скин, пробе — проверить ИМЕННО
// этот пробел, а не наличие какого-нибудь вывода.
//
// ## Полнота не навязывается
//
// Неодетое — это ДОЛГ, а не поломка. Скин вправе одевать часть кита: механика сообщает, а не
// запрещает. Поэтому здесь нет ни отказа, ни исключения — только перечень; что с ним делать,
// решает потребитель.
//
// ## Что считается непокрытым, а что нет
//
// Считаем только ОБЪЯВЛЕННОЕ: непокрытым может быть лишь то, что паспорт про себя сказал.
// Ненаблюдаемого не изобретаем — иначе перечень наполнился бы долгами, которых никто не брал.
//
// Три решения, каждое названо, потому что каждое могло быть принято иначе:
//
//   • **компонент без рецепта даёт ОДИН пробел**, а не пробел на каждую свою часть и состояние.
//     Ответ про него один — «его не одевали вовсе», — и разворачивать это в два десятка строк
//     значит утопить в них то, что читать действительно нужно. Так же и с частью: не одета
//     часть — её состояния не перечисляются;
//   • **часть, упомянутая только как ПРЕДОК чужого правила, одетой не считается.** Предок в
//     правиле — условие, а вид получает другая часть. Зачти мы это, скин выглядел бы одетым там,
//     где вида не дали;
//   • **правка образца в покрытие не идёт вовсе** — она одевает одно место, а не координату.
//     Это держится не отбором, а тем, что покрытие считает только обход рецептов (`rules.ts`).

import type { ComponentPassport } from "@omnifield/probe-web-ui/passport";
import { partOf } from "@omnifield/probe-web-ui/passport";

import { passportLookup } from "./address.js";
import type { Skin } from "./recipe.js";
import { skinRules, type SkinRule } from "./rules.js";
import { trace } from "./trace.js";

/**
 * Что скин ОДЕЛ — снято с адресов правил.
 *
 * Адрес несёт само правило (`SkinRule.coordinate`), поэтому отдельной копилки в обходе нет:
 * второй перечень того же самого разошёлся бы с первым молча. «Одел» значит «дал вид» — часть,
 * упомянутая только как предок, своего правила не получает и сюда не попадает.
 */
function dressed(rules: readonly SkinRule[]): { parts: Set<string>; states: Set<string> } {
  const parts = new Set<string>();
  const states = new Set<string>();

  for (const { coordinate } of rules) {
    const part = `${coordinate.component}.${coordinate.part}`;
    parts.add(part);
    for (const state of coordinate.states) states.add(`${part}:${state}`);
  }

  return { parts, states };
}

/**
 * Что именно не одето.
 *
 *  • `component` — паспорт есть, рецепта нет: компонент не одевали вовсе;
 *  • `part`      — часть объявлена анатомией, но ни одно правило её не касается;
 *  • `state`     — состояние объявлено паспортом части, но ни одно правило его не адресует.
 */
export type SkinGapKind = "component" | "part" | "state";

/**
 * Один пробел покрытия.
 *
 * Размеченное объединение, а не поля «часть, если есть»: у пробела про компонент части НЕТ, и
 * необязательное поле заставляло бы каждого читателя гадать, значит ли `undefined` «не
 * относится» или «не посчитали».
 */
export type SkinGap =
  | {
      readonly kind: "component";
      readonly component: string;
      /** Что это значит человеку. */
      readonly means: string;
    }
  | {
      readonly kind: "part";
      readonly component: string;
      readonly part: string;
      readonly means: string;
    }
  | {
      readonly kind: "state";
      readonly component: string;
      readonly part: string;
      readonly state: string;
      readonly means: string;
    };

/** Собирает пробелы одного компонента. */
function gapsOfComponent(
  passport: ComponentPassport,
  touched: { parts: ReadonlySet<string>; states: ReadonlySet<string> },
  gaps: SkinGap[],
): void {
  const component = passport.component;

  // Перечень частей берётся у АНАТОМИИ: она источник, а добавка паспорта — приписка к ней.
  // Часть, объявленная анатомией и забытая в добавке, одета всё равно не будет, и молчать о ней
  // значило бы считать, что частей меньше, чем компонент про себя сказал.
  for (const part of passport.anatomy.keys()) {
    if (!touched.parts.has(`${component}.${part}`)) {
      gaps.push({
        kind: "part",
        component,
        part,
        means: `часть «${part}» компонента «${component}» объявлена, но ни одно правило скина её ` +
          "не касается",
      });
      continue;
    }

    // Часть без добавки к анатомии — пробел ПАСПОРТА, а не долг скина: словаря состояний у неё
    // нет, и требовать одеть несуществующее состояние не за что.
    for (const state of partOf(passport, part)?.states ?? []) {
      if (touched.states.has(`${component}.${part}:${state.name}`)) continue;

      gaps.push({
        kind: "state",
        component,
        part,
        state: state.name,
        means: `состояние «${state.name}» части «${part}» (${state.means}) объявлено, но ни одно ` +
          "правило скина его не адресует",
      });
    }
  }
}

/**
 * Перечень того, чего скин ещё не одел.
 *
 * ```ts
 * import { PASSPORTS } from "@omnifield/probe-web-ui/passport";
 *
 * const gaps = skinGaps(skin, Object.values(PASSPORTS));
 * ```
 *
 * Перечень компонентов приходит СНАРУЖИ и своего здесь не заводится: он принадлежит реестру, а
 * редактор держит компоненты из нескольких пакетов сразу. Порядок ответа — порядок перечня, и
 * внутри компонента — порядок анатомии и порядок объявления состояний: он принадлежит паспорту,
 * а не обходу.
 *
 * Скин с изъянами считается тоже: пока человек правит, ему нужен ответ, а не отказ.
 *
 * @param skin скин целиком
 * @param passports паспорта, покрытие по которым считать
 * @returns пробелы; пустой перечень — скин одел всё объявленное
 */
export function skinGaps(skin: Skin, passports: Iterable<ComponentPassport>): readonly SkinGap[] {
  const done = trace(`skinGaps(${skin.name})`);

  const list = [...passports];
  // Обход рецептов зовёт паспорт по имени — для предка, живущего в чужом дереве. Лукап собран из
  // того же перечня: второго источника паспортов у покрытия нет.
  const touched = dressed(skinRules(skin, passportLookup(list)).rules);

  const gaps: SkinGap[] = [];

  for (const passport of list) {
    if (!(passport.component in skin.recipes)) {
      gaps.push({
        kind: "component",
        component: passport.component,
        means: `компонент «${passport.component}» объявлен, но рецепта в скине у него нет`,
      });
      continue;
    }

    gapsOfComponent(passport, touched, gaps);
  }

  done();
  return gaps;
}
