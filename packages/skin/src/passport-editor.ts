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
  type PassportAdmission,
  type PassportAssembly,
  type PassportAssemblyPart,
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
}

/** То, что объявляет `defineEditorInfo` — `PassportEditorInfo` без снятого имени компонента. */
export interface PassportEditorSpec<Part extends string> {
  readonly package: string;
  readonly genus: PassportComponentGenus;
  readonly group?: ComponentGroup;
  readonly variantAxis: { readonly means: string };
  readonly parts: Readonly<Record<Part, PassportPartEditorInfo<Part>>>;
  readonly settings?: Readonly<Record<string, PassportSettingEditorInfo>>;
  readonly assemblies?: readonly PassportAssembly<Part>[];
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

  if (assembly.tree.part !== passport.root) {
    throw new Error(
      `сборка «${component}» (${assembly.means}) начинается с части «${assembly.tree.part}», а ` +
        `корень компонента — «${passport.root}»`,
    );
  }

  const walk = (node: PassportAssemblyPart<Part>): void => {
    if (!declared.includes(node.part)) {
      throw new Error(`сборка «${component}» (${assembly.means}) называет часть «${node.part}» мимо анатомии`);
    }

    const owner = parts[node.part];

    for (const child of node.children ?? []) {
      const candidate: PassportAdmission<Part> = isAssemblyContent(child)
        ? { kind: "content", genus: child.genus }
        : { kind: "part", name: child.part };

      if (owner && !admits(owner, candidate)) {
        const что = isAssemblyContent(child) ? `содержимое рода «${child.genus}»` : `часть «${child.part}»`;

        throw new Error(
          `сборка «${component}» (${assembly.means}) кладёт ${что} внутрь части «${node.part}», ` +
            `которая этого не допускает`,
        );
      }

      if (!isAssemblyContent(child)) walk(child);
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
  for (const assembly of assemblies) checkAssembly(component, passport, spec.parts, assembly);

  return {
    component,
    package: spec.package,
    genus: spec.genus,
    group: spec.group,
    variantAxis: spec.variantAxis,
    parts: spec.parts,
    settings: spec.settings,
    assemblies,
  };
}
