// РЕЕСТР витрины — то, из чего она собирает и по чему проверяет (`PWEB-31`).
//
// ## Своего перечня компонентов здесь нет
//
// Витрина не ведёт список того, что умеет показывать. Она складывает то, что приходит СНАРУЖИ:
//
//   • пары «паспорт и части» — даёт поставщик кита (`kitOf`);
//   • правило допуска — по какому правилу читается объявленное; едет вместе с формой паспорта.
//
// Заведи витрина свой перечень — «флоу один для всех» кончилось бы в тот же день: чужой пакет
// попадал бы в пульт только после правки НАШЕГО кода, то есть с нашего разрешения.
//
// ## Карту частей собирает ПОСТАВЩИК, а не мы
//
// Прежде составной компонент собирался здесь руками: `Accordion` рядом с `AccordionItem`, и
// совпадение ключей с паспортом держалось на внимательности. Двадцать потребителей написали бы
// двадцать таких карт, и добавленная китом шестая часть молча осталась бы неодетой у каждого.
//
// Теперь пара приезжает готовой и сверенной у поставщика (`defineKitComponent`), а расхождение
// ловится там, где его можно починить, — у того, кто карту пишет.
//
// ## Род и допуск — из среза РЕДАКТОРА, не из паспорта (`PWEB-115`/`PWEB-118`)
//
// Форма паспорта разрезана на два физически разных подпути: рантайм (`.../model`, его и несёт
// `KIT[x].passport`) и редактор (`.../editor`, `genus`/`accepts`/`means`). Механике сборки
// (`ReadablePassport`) для правила вложенности нужны ОБА сразу — она не наш рантайм и не наш
// редактор, а общая механика, которой всё равно, кто поставщик. Витрина складывает их сама:
// читатель редактора здесь и есть то самое место, которому этот срез предназначен.
import {
  createRegistry,
  type Admission,
  type ReadableComponent,
  type ReadablePart,
  type Registry,
} from "@omnifield/probe-web-assembly";
import { KIT } from "@omnifield/probe-web-ui";
import { admits, editorInfoOf } from "@omnifield/probe-web-ui/passport";

/** Пара кита плюс срез редактора, сложенные в форму, которую просит механика сборки. */
function readable(component: string): ReadableComponent {
  const { passport, parts } = KIT[component];
  const editorInfo = editorInfoOf(component);

  if (!editorInfo) {
    throw new Error(
      `витрина: у компонента «${component}» нет среза редактора — род и допуск объявить нечем`,
    );
  }

  return {
    passport: {
      component: passport.component,
      // `Genus`/`Admission` у механики сборки — открытый `string`: она служит любому
      // поставщику, а не только нашему закрытому перечню родов. Наши значения приходят из
      // закрытого перечня (`PassportGenus`) — того же самого, просто более узким типом.
      genus: editorInfo.genus,
      anatomy: passport.anatomy,
      root: passport.root,
      parts: passport.parts.map(
        (part): ReadablePart => ({
          name: part.name,
          accepts: editorInfo.parts[part.name]?.accepts as readonly Admission[] | undefined,
        }),
      ),
    },
    parts,
  };
}

/**
 * Реестр витрины.
 *
 * Перечень берётся у кита ЦЕЛИКОМ: витрина показывает то, что поставщик отдаёт, а не то, что мы
 * успели вписать. Компонент, приехавший с новым выпуском кита, появляется в пульте сам — вместе
 * со своим долгом одевания, который сразу видно.
 */
export const REGISTRY: Registry = createRegistry({
  components: Object.fromEntries(Object.keys(KIT).map((name) => [name, readable(name)])),
  admits: admits as (part: ReadablePart, candidate: Admission) => boolean,
});
