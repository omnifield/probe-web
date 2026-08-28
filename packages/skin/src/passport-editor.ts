// СРЕЗ РЕДАКТОРА (`PWEB-115`) — вторая половина паспорта: то, что читают человек и редакторская
// механика продукта, но НИКОГДА не читает `generateSkinCss`/`checkOutfit`/`assemble`.
//
// ## Зачем разрез и почему именно так
//
// Разбор найденного и довод в пользу двух функций вместо двух полей — в шапке `passport-form.ts`
// (раздел «Паспорт режется на два среза»). Коротко: неиспользуемое ПОЛЕ бандлер не выкидывает,
// неиспользуемый ЭКСПОРТ — выкидывает, если тот вправе доказать отсутствие побочных эффектов.
//
// ## Как объявлять, чтобы срез физически не попал в бандл приложения
//
// ```ts
// export const passport = definePassport({ ... });               // рантайм: экспорт А
// export const editorInfo = /*@__PURE__*/ defineEditorInfo(       // редактор: экспорт Б,
//   passport,                                                     // ПОМЕЧЕННЫЙ pure
//   { ... },
// );
// ```
//
// Три условия обязаны выполниться ОДНОВРЕМЕННО, иначе бандлер не вправе выбросить второй экспорт
// (проверено экспериментом на настоящем Rolldown/Vite 8):
//
//  1. `editorInfo` — ОТДЕЛЬНАЯ привязка верхнего уровня, не поле внутри объекта `passport`;
//  2. вызов `defineEditorInfo(...)` помечен `/*@__PURE__*/` ПРЯМО ПЕРЕД собой — иначе бандлер не
//     вправе счесть его чистым (внутри — циклы и `throw`, сам по себе он этого не докажет);
//  3. поставляющий пакет объявляет `"sideEffects": false` в `package.json` — иначе бандлер не
//     вправе выбросить исполнение МОДУЛЯ целиком, даже когда ни одна его привязка не используется.
//
// Тот, кто импортирует только `passport`, не создаёт ссылки на `editorInfo` вовсе — и бандлер
// выбрасывает и вызов, и всё, что тот вернул бы (`means`, сборки), не потому что кто-то пообещал их
// не трогать, а потому что от них физически не осталось ни одной живой ссылки.
//
// ## Что здесь, а чего нет
//
//  • `means` — везде, где было в рантайм-форме: у состояний, переменных, оси вариаций, настроек и
//    их значений, у самой части;
//  • род компонента (`genus`, `PassportComponentGenus` — из `passport-assembly.ts`, там же и
//    `PassportAdmission`/`admits`: род и правило вложенности — одна проверяемая пара, разводить их
//    по файлам значило бы читателю искать половину правила в другом месте);
//  • группа в перечне витрины и редактора (`GROUPS`, `groupOf`, `PWEB-34`);
//  • пакет-поставщик (`package`);
//  • правило вложенности части (`accepts`);
//  • сборки — ТЕПЕРЬ СПИСКОМ (`PassportEditorInfo.assemblies`), не одна запись. Задача, ради
//    которой список заведён (`packages/ui`, гармошка с «три раздела, первый раскрыт» и «пять
//    разделов, все закрыты»), — следующая; здесь меняется форма, не содержимое.
//
// ## Гарантия РАБОЧЕГО дерева сборки — машиной, не обещанием
//
// Две половины, и обе обязательны:
//
//  • **типом.** `PassportAssembly.tree` не бывает `undefined` — запись без корня не наберётся
//    вовсе, «пустой сборки» как отдельного состояния не существует;
//  • **на исполнении.** `defineEditorInfo` прогоняет КАЖДУЮ сборку списка тем же обходом, что
//    раньше проверял единственную: корень — только корневая часть компонента, каждая часть —
//    из анатомии, каждый вложенный узел — допустим правилом `admits` своего владельца. Поставщик
//    без TypeScript получает точно те же отказы, что и раньше получал бы у единственной записи;
//    список меняет только то, что обход повторяется на каждом элементе.

import {
  admits,
  isAssemblyContent,
  isAssemblyExtra,
  isAssemblyRef,
  isAssemblyRepeat,
  type DataPreset,
  type PassportAdmission,
  type PassportAssembly,
  type PassportAssemblyContent,
  type PassportAssemblyElement,
  type PassportAssemblyExtra,
  type PassportAssemblyNode,
  type PassportComponentGenus,
} from "./passport-assembly.js";
import type { ComponentPassport, PassportSettingName } from "./passport-form.js";

export type { PassportComponentGenus, PassportGenus, PassportAdmission } from "./passport-assembly.js";
export { admits } from "./passport-assembly.js";

/**
 * ГРУППЫ компонентов — разделы, на которые перечень бьётся в витрине и в редакторе.
 *
 * Перечень ЗАКРЫТ и живёт здесь, а не у пульта (`PWEB-34`). Заведи разделы витрина — это второй
 * перечень: каждый пульт назовёт группы по-своему, и они разойдутся; при трёх десятках
 * компонентов расходиться будет уже больно. Группа принадлежит поставщику наравне со всем
 * остальным, что он о себе объявляет.
 *
 * Подпись едет вместе со слугом по той же причине: имя раздела — половина «места в перечне», и
 * переводи его каждый пульт сам, мы получили бы те же расхождения на шаг позже.
 *
 * **Сверено с рынком 2026-08-20.** Категории берём не из головы: Material UI делит компоненты на
 * `Inputs · Data display · Feedback · Surfaces · Navigation · Layout · Utils`, Ant Design — на
 * `General · Layout · Navigation · Data Entry · Data Display · Feedback · Other`. Совпадающее ядро
 * (ввод, навигация, отклик, раскладка, «прочее») взято как есть. Ark UI, на который кит
 * переезжает, компоненты НЕ группирует вовсе — оттуда взять было нечего, и это тоже итог сверки.
 * Своего у нас два: «всплывающее» (у нас их шесть — окна, панели, подсказки, два меню) и
 * «раскрывашки» — оба выделены потому, что так устроен НАШ кит, а не для красоты.
 *
 * Порядок записей — порядок разделов в перечне: он объявлен здесь один раз, иначе каждый пульт
 * отсортирует по-своему.
 *
 * Новая группа заводится ТОЛЬКО решением — как и новое имя состояния. Иначе поставщики
 * наизобретают синонимов, и разделов станет больше, чем компонентов.
 */
export const GROUPS = {
  actions: "Действия",
  inputs: "Ввод",
  navigation: "Навигация",
  overlays: "Всплывающее",
  disclosure: "Раскрывашки",
  feedback: "Отклик",
  layout: "Раскладка",
  other: "Прочее",
} as const satisfies Readonly<Record<string, string>>;

/** Имя группы — ключ закрытого перечня. */
export type ComponentGroup = keyof typeof GROUPS;

/**
 * Группа, которая действует, когда компонент своей не назвал.
 *
 * Умолчание обязано быть РАБОЧИМ: компонент без группы из перечня не исчезает, он попадает в
 * «прочее». Не объяви мы это здесь — каждый пульт придумал бы свой запасной раздел («без
 * группы», «разное», «остальное»), и перечни разошлись бы ровно так же, как без самого поля.
 */
const DEFAULT_GROUP: ComponentGroup = "other";

/**
 * Группа компонента — объявленная либо действующая по умолчанию.
 *
 * Принимает срез РЕДАКТОРА, а не паспорт целиком (`PWEB-115`): группа рантайму не принадлежит и
 * в нём больше не живёт. Живёт рядом с формой по той же причине, что и `admits`: умолчание — это
 * правило, а правило, написанное вторым читателем, разъезжается с написанным первым молча.
 *
 * @param info срез редактора компонента (или его часть — группу как таковую)
 */
export function groupOf(info: { readonly group?: ComponentGroup }): ComponentGroup {
  return info.group ?? DEFAULT_GROUP;
}

/**
 * ОБЪЁМ компонента — сколько ему нужно места в галерее случаев (витрина, редактор).
 *
 * Раньше это решала не декларация, а ИЗМЕРЕНИЕ: показ мерил `scrollWidth` уже отрисованного узла
 * (`products/skin/src/showcase/case.tsx`, порог `WIDE_AT`) и разворачивал карточку на всю строку,
 * если она не поместилась. Приём случайный: он ловит фактическую ширину ОДНОГО показанного
 * образца при ОДНОМ надетом наряде, а не то, каким компонент является по своей природе — кнопка
 * с длинной подписью и гармошка с `inlineSize: 100%` (чтобы не прыгать при раскрытии) обе
 * измеряются неверно, каждая на свой лад.
 *
 * Компонент знает о себе то, чего показ узнать не может: кнопка — маленький атом действия,
 * гармошка — крупнее, но не претендует на всю строку, таблица — претендует всегда. Это тот же
 * довод, что у `genus`/`group`: свойство самого компонента, а не наблюдение того, кто его
 * показывает, — значит и объявляет его поставщик, рядом с остальным, что он о себе знает.
 *
 * Три значения, не шкала: `compact` (мелкий атом — кнопка, чекбокс, переключатель, иконка,
 * попап-триггер), `regular` (умолчание — большинству есть что показать, но во всю строку это не
 * нужно), `wide` (нуждается в строке целиком по природе — таблица, карусель).
 */
export type ComponentFootprint = "compact" | "regular" | "wide";

/**
 * Объём, который действует, когда компонент своего не назвал.
 *
 * `regular` — то же самое положение, в котором сейчас показывается любой компонент без вариации
 * или состояния: середина, а не крайность. Компонент, ещё не сказавший, сколько ему нужно места,
 * не должен молча стать ни самым мелким, ни самым широким.
 */
const DEFAULT_FOOTPRINT: ComponentFootprint = "regular";

/**
 * Объём компонента — объявленный либо действующий по умолчанию.
 *
 * Тем же приёмом, что и `groupOf`: принимает срез РЕДАКТОРА, потому что показу нечего смотреть в
 * рантайм-паспорт ради того, что там никогда не жило.
 *
 * @param info срез редактора компонента (или его часть — объём как таковой)
 */
export function footprintOf(info: { readonly footprint?: ComponentFootprint }): ComponentFootprint {
  return info.footprint ?? DEFAULT_FOOTPRINT;
}

/** Что состояние значит человеку — половина `PassportState`, которую редактор держит отдельно. */
export interface PassportStateEditorInfo {
  readonly means: string;
}

/** Что переменная значит человеку — половина `PassportVariable`. */
export interface PassportVariableEditorInfo {
  readonly means: string;
}

/** Что значение настройки-выбора значит человеку — половина `PassportSettingOption`. */
export interface PassportSettingOptionEditorInfo {
  readonly means: string;
}

/**
 * Что настройка значит человеку — половина `PassportSetting`.
 *
 * `options`, если у настройки `values.kind === "choice"`: по значению — что оно означает.
 * Ключи обязаны совпасть с `PassportSettingOption.value` из рантайм-среза — `defineEditorInfo`
 * сверяет это на исполнении, а не типом: тип рантайм-настройки к этому моменту уже сузился до
 * `Record<string, PassportSetting>`, и открытая настройка от закрытой типом не отличается.
 */
export interface PassportSettingEditorInfo {
  readonly means: string;
  readonly options?: Readonly<Record<string, PassportSettingOptionEditorInfo>>;
}

/**
 * Добавка к части — половина `PassportPart`, которую держит редактор.
 *
 * `states`/`variables` — по ИМЕНИ состояния/переменной по факту, ключами: `defineEditorInfo`
 * требует, чтобы перечень ключей совпал ровно с тем, что часть объявила рантайму — не больше и не
 * меньше. Часть без состояний/переменных эти поля не заполняет вовсе.
 */
export interface PassportPartEditorInfo<Part extends string = string> {
  /** Назначение части — человеку и редактору. */
  readonly means: string;
  /**
   * Правило вложенности: что допустимо ВНУТРИ этой части — свои части и содержимое потребителя.
   *
   * Три состояния, и все три разные:
   *
   *  • **не объявлено** — часть не запрещает ничего. Молчание это не запрет: иначе первая же
   *    часть с незаполненным полем перестала бы принимать содержимое, и паспорт соврал бы за неё;
   *  • **пустой перечень** — не пускает НИЧЕГО: место занято самим компонентом;
   *  • **перечень** — допустимо ровно перечисленное, остальное отвергается.
   *
   * Читается в обе стороны: вперёд — редактором, чтобы не дать собрать сломанное дерево; назад —
   * механикой скина, которая выводит отсюда перечень возможных ПРЕДКОВ части.
   */
  readonly accepts?: readonly PassportAdmission<Part>[];
  readonly states?: Readonly<Record<string, PassportStateEditorInfo>>;
  readonly variables?: Readonly<Record<string, PassportVariableEditorInfo>>;
}

/** Срез редактора компонента целиком — то, что читают только человек и редакторская механика. */
export interface PassportEditorInfo<Part extends string = string> {
  /** Имя компонента. Снято с паспорта, руками не повторяется — тем же доводом, что и в рантайме. */
  readonly component: string;
  /** Откуда компонент приехал. Форма одна на всех, поэтому поставщик назван данными. */
  readonly package: string;
  /**
   * Род самого компонента — чем он является, когда его кладут ВНУТРЬ чужого узла.
   *
   * Вторая сторона правила вложенности, без которой оно не решаемо: часть говорит, какой род
   * пускает, компонент — какого он рода. Опознавать кандидата иначе можно было бы только
   * перечнем имён, а имён чужих пакетов кит не знает и знать не должен.
   */
  readonly genus: PassportComponentGenus;
  /**
   * Место компонента в перечне — раздел витрины или редактора.
   *
   * Не вид и не поведение: группа не говорит о компоненте ничего, кроме того, где его искать
   * человеку. Не объявлена — компонент не пропадает, а попадает в «прочее» (`groupOf`).
   */
  readonly group?: ComponentGroup;
  /** Сколько компоненту нужно места в галерее случаев. Не объявлен — действует `footprintOf`. */
  readonly footprint?: ComponentFootprint;
  /** Что ось вариаций значит человеку — половина `PassportVariantAxis`. */
  readonly variantAxis: { readonly means: string };
  /** Добавка к каждой части — ключами анатомии, тем же перечнем, что в рантайме. */
  readonly parts: Readonly<Record<Part, PassportPartEditorInfo<Part>>>;
  /** Что настройки значат человеку — ключами имён закрытого перечня, как и в рантайме. */
  readonly settings?: Readonly<Record<string, PassportSettingEditorInfo>>;
  /**
   * Сборки — рабочие экземпляры компонента (`PWEB-89`, список — `PWEB-115`).
   *
   * Пустой перечень — компонент, чью сборку ещё не объявили: честно, а не заглушкой. Заглушка
   * выглядела бы как объявленный экземпляр, которого нет.
   */
  readonly assemblies: readonly PassportAssembly<Part>[];
  /**
   * Заготовленные варианты заполнения (`PWEB-156`) — под сборку с именем `filled`, если она
   * объявлена. Пустой перечень — компонент без такой сборки либо без заготовленных данных под
   * неё: честно, не заглушкой, тем же приёмом, что и у пустого перечня сборок.
   */
  readonly dataPresets: readonly DataPreset[];
}

/** То, что объявляет `defineEditorInfo` — `PassportEditorInfo` без снятого имени компонента. */
export interface PassportEditorSpec<Part extends string> {
  readonly package: string;
  readonly genus: PassportComponentGenus;
  readonly group?: ComponentGroup;
  readonly footprint?: ComponentFootprint;
  readonly variantAxis: { readonly means: string };
  readonly parts: Readonly<Record<Part, PassportPartEditorInfo<Part>>>;
  readonly settings?: Readonly<Record<string, PassportSettingEditorInfo>>;
  readonly assemblies?: readonly PassportAssembly<Part>[];
  readonly dataPresets?: readonly DataPreset[];
}

/**
 * Сверяет одну сборку с тем, что паспорт и срез редактора объявили.
 *
 * Тот же обход, что раньше проверял единственную запись (`checkAssembly` в `passport-form.ts` до
 * `PWEB-115`), — здесь вызывается на КАЖДОЙ сборке списка.
 *
 * @param component имя компонента — для сообщения об отказе
 * @param passport паспорт компонента — источник корня и перечня частей анатомии
 * @param parts срез редактора по частям — источник `accepts` для проверки вложенности
 * @param assembly сборка, которую проверяют
 */
function checkAssembly<Part extends string>(
  component: string,
  passport: ComponentPassport<Part>,
  parts: Readonly<Record<Part, PassportPartEditorInfo<Part>>>,
  assembly: PassportAssembly<Part>,
): void {
  const declared = passport.anatomy.keys();

  if (assembly.name.trim() === "") {
    throw new Error(
      `сборка «${component}» (${assembly.means}) без имени — по позиции в списке её не адресовать`,
    );
  }

  if (assembly.tree.node !== passport.root) {
    throw new Error(
      `сборка «${component}.${assembly.name}» начинается с узла «${assembly.tree.node}», а ` +
        `корень компонента — «${passport.root}»`,
    );
  }

  // Own part or a bare reference to another component of the shared registry — same field
  // (`node`, `PWEB-172`), told apart the only way it can be here: by comparing against THIS
  // component's own anatomy. Note what this costs, on purpose, not by oversight: a typo in an
  // own part name used to be rejected right here (`declared.includes(node.part)`); now it is
  // indistinguishable from "a real foreign component named that" and is simply treated as one —
  // the same limit `component:` always had (`PWEB-166`), now shared by both.
  const declaredNames: readonly string[] = declared;
  const isOwnPart = (node: { readonly node: string }): boolean => declaredNames.includes(node.node);

  // Повтор (`PassportAssemblyRepeat`, `PWEB-156`) и ссылка (`PassportAssemblyRef`, `PWEB-160`)
  // ПРОЗРАЧНЫ для допуска: место в дереве занимает не он сам, а то, чем он размножается/на что
  // ссылается, — уходит сквозь оба до части/содержимого/extra, ровно как `outerTypeOf` уходит
  // сквозь композицию в `packages/assembly/src/tree.ts`.
  const templateOf = (
    node: PassportAssemblyNode<Part>,
  ): PassportAssemblyElement<Part> | PassportAssemblyContent | PassportAssemblyExtra<Part> => {
    if (isAssemblyRepeat(node)) return templateOf(node.template);

    if (isAssemblyRef(node)) {
      const target = assembly.refs?.[node.ref];
      if (!target) {
        throw new Error(
          `сборка «${component}.${assembly.name}» ссылается на «${node.ref}», которого нет в её refs`,
        );
      }
      return templateOf(target);
    }

    return node;
  };

  // Узел-родитель при обходе — часть анатомии, ссылка на ЧУЖОЙ компонент реестра (`node`,
  // `PWEB-172`) либо вспомогательный компонент кита (extra, без адреса анатомии —
  // `PassportAssemblyExtra`, `PWEB-152`). Содержимое обходу не подлежит: у него нет детей по
  // построению типа.
  const walk = (node: PassportAssemblyElement<Part> | PassportAssemblyExtra<Part>): void => {
    // Extra не заводит собственного правила вложенности в срезе редактора (тот держит записи ТОЛЬКО
    // по частям анатомии) — вложенность внутрь extra поэтому не проверяется здесь; несовпадение
    // extra-имени с картой поставщика (`KitComponent.extras`) ловит `checkRegistry`, не этот обход.
    // Ссылка на компонент реестра — та же логика и по той же причине: что она пускает внутрь себя,
    // решает ЕГО СОБСТВЕННЫЙ срез редактора, не этот, и мы туда не спускаемся вовсе (см. ниже).
    const owner = !isAssemblyExtra(node) && isOwnPart(node) ? parts[node.node as Part] : undefined;

    for (const declaredChild of node.children ?? []) {
      const child = templateOf(declaredChild);
      const candidate: PassportAdmission<Part> = isAssemblyContent(child)
        ? { kind: "content", genus: child.genus }
        : isAssemblyExtra(child)
          ? { kind: "extra", name: child.extra }
          : isOwnPart(child)
            ? { kind: "part", name: child.node as Part }
            : { kind: "component" };

      if (owner && !admits(owner, candidate)) {
        const что = isAssemblyContent(child)
          ? `содержимое рода «${child.genus}»`
          : isAssemblyExtra(child)
            ? `вспомогательный компонент «${child.extra}»`
            : isOwnPart(child)
              ? `часть «${child.node}»`
              : `ссылку на компонент реестра «${child.node}»`;
        const куда = isAssemblyExtra(node)
          ? `вспомогательный узел «${node.extra}»`
          : isOwnPart(node)
            ? `часть «${node.node}»`
            : `ссылку «${node.node}»`;

        throw new Error(
          `сборка «${component}.${assembly.name}» кладёт ${что} внутрь ${куда}, ` +
            `которая этого не допускает`,
        );
      }

      // Внутрь ссылки на ЧУЖОЙ компонент не спускаемся: что она сама пускает внутрь себя, решает
      // ЕГО собственный срез редактора (свой `parts`), не этот обход — второй проверки того же
      // компонента чужими правилами здесь не заводим.
      if (!isAssemblyContent(child) && (isAssemblyExtra(child) || isOwnPart(child))) walk(child);
    }
  };

  walk(assembly.tree);
}

/**
 * Объявляет срез РЕДАКТОРА компонента — вторым доводом к паспорту (`PWEB-115`).
 *
 * Порядок вызовов важен: `passport` обязан быть уже собран (`definePassport`), потому что
 * `defineEditorInfo` сверяет имена частей, состояний, переменных, настроек и их значений с тем,
 * что рантайм ДЕЙСТВИТЕЛЬНО объявил, — те же две гарантии, что были у единственного `means` на
 * поле: типом там, где различимо статически (`Record<Part, …>` требует записи на КАЖДУЮ часть
 * анатомии), и на исполнении там, где нет (имена состояний, переменных, настроек — обычные
 * строки, и несовпадение с рантаймом типом не ловится).
 *
 * Экспортируй результат ОТДЕЛЬНОЙ привязкой, помеченной `/*@__PURE__*\/` прямо перед вызовом —
 * иначе граница между срезами не сработает физически, а останется обещанием (разбор — в шапке
 * файла).
 *
 * @param passport паспорт компонента — рантайм-срез, уже собранный `definePassport`
 * @param spec добавка редактора: назначения человеку, род, группа, пакет, сборки
 */
export function defineEditorInfo<Part extends string>(
  passport: ComponentPassport<Part>,
  spec: PassportEditorSpec<Part>,
): PassportEditorInfo<Part> {
  const component = passport.component;

  // Перечень групп закрыт, и закрыт он не только типами: поставщик вправе приехать сборкой без
  // TypeScript, и тогда единственное, что стоит между «своей» группой и перечнем витрины, — эта
  // проверка.
  if (spec.group !== undefined && !Object.hasOwn(GROUPS, spec.group)) {
    throw new Error(
      `группа «${spec.group}» не из перечня; допустимы: ${Object.keys(GROUPS).join(", ")}`,
    );
  }

  const anatomyParts = passport.anatomy.keys();
  const specParts = Object.keys(spec.parts);

  const missingParts = anatomyParts.filter((part) => !specParts.includes(part));
  if (missingParts.length > 0) {
    throw new Error(`срез редактора «${component}» не назначил части: ${missingParts.join(", ")}`);
  }

  const strangeParts = specParts.filter((part) => !anatomyParts.includes(part as Part));
  if (strangeParts.length > 0) {
    throw new Error(`срез редактора «${component}» называет часть мимо анатомии: ${strangeParts.join(", ")}`);
  }

  for (const part of passport.parts) {
    const editorPart = spec.parts[part.name];

    const stateNames = part.states.map((state) => state.name);
    const editorStateNames = Object.keys(editorPart.states ?? {});
    if (stateNames.some((name) => !editorStateNames.includes(name)) || editorStateNames.some((name) => !stateNames.includes(name))) {
      throw new Error(
        `срез редактора части «${part.name}» компонента «${component}» не совпадает с состояниями ` +
          `рантайма: рантайм — ${stateNames.join(", ") || "(нет)"}, редактор — ${editorStateNames.join(", ") || "(нет)"}`,
      );
    }

    const variableNames = (part.variables ?? []).map((variable) => variable.name);
    const editorVariableNames = Object.keys(editorPart.variables ?? {});
    if (
      variableNames.some((name) => !editorVariableNames.includes(name)) ||
      editorVariableNames.some((name) => !variableNames.includes(name))
    ) {
      throw new Error(
        `срез редактора части «${part.name}» компонента «${component}» не совпадает с переменными ` +
          `рантайма: рантайм — ${variableNames.join(", ") || "(нет)"}, редактор — ${editorVariableNames.join(", ") || "(нет)"}`,
      );
    }
  }

  const settingNames = Object.keys(passport.settings) as PassportSettingName[];
  const editorSettings = spec.settings ?? {};
  const missingSettings = settingNames.filter((name) => !Object.hasOwn(editorSettings, name));
  if (missingSettings.length > 0) {
    throw new Error(`срез редактора «${component}» не назначил настройки: ${missingSettings.join(", ")}`);
  }

  for (const name of settingNames) {
    const values = passport.settings[name]!.values;
    if (values.kind !== "choice") continue;

    const optionValues = values.options.map((option) => option.value);
    const editorOptions = Object.keys(editorSettings[name]?.options ?? {});
    if (
      optionValues.some((value) => !editorOptions.includes(value)) ||
      editorOptions.some((value) => !optionValues.includes(value))
    ) {
      throw new Error(
        `срез редактора настройки «${name}» компонента «${component}» не совпадает со значениями ` +
          `рантайма: рантайм — ${optionValues.join(", ") || "(нет)"}, редактор — ${editorOptions.join(", ") || "(нет)"}`,
      );
    }
  }

  const assemblies = spec.assemblies ?? [];
  const assemblyNames = new Set<string>();

  for (const assembly of assemblies) {
    checkAssembly(component, passport, spec.parts, assembly);

    // Имя — адрес, а адрес обязан быть однозначным: повтори его два раза, и «взять схему по
    // имени» перестало бы значить что-то одно.
    if (assemblyNames.has(assembly.name)) {
      throw new Error(`сборка «${component}.${assembly.name}» названа дважды — имя не адрес`);
    }
    assemblyNames.add(assembly.name);
  }

  const dataPresets = spec.dataPresets ?? [];
  const presetNames = new Set<string>();

  for (const preset of dataPresets) {
    // Тем же доводом, что у сборок: имя — адрес, повтори его дважды — и «взять пресет по имени»
    // перестало бы значить что-то одно.
    if (presetNames.has(preset.name)) {
      throw new Error(`вариант заполнения «${component}.${preset.name}» назван дважды — имя не адрес`);
    }
    presetNames.add(preset.name);
  }

  return {
    component,
    package: spec.package,
    genus: spec.genus,
    group: spec.group,
    footprint: spec.footprint,
    variantAxis: spec.variantAxis,
    parts: spec.parts,
    settings: spec.settings,
    assemblies,
    dataPresets,
  };
}
