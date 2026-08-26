// ВИД ДЕЛИТСЯ НА ТРИ — палитра, форма, наряд. Складываются ПРИ НАДЕВАНИИ (`PWEB-78`).
//
// ## Почему прежней единицы не хватило
//
// Компоненты приходят от РАЗНЫХ поставщиков, и поставщик компонентов вида не пишет. Одна запись
// на всё требует человека, который опишет вид всех компонентов сразу, — такого человека нет.
//
// Режется по «значение — употребление», а не по «цвет — не цвет». Форма решает не сколько, а
// ГДЕ: какие углы скругляемы, где рамка предусмотрена, где зазор. Величину даёт палитра. Режь мы
// по цвету — второй поставщик привёз бы свои скругления, и общий бренд остался бы только в цвете.
//
// ## Что осталось от прежней единицы, и почему это не половинчатость
//
// `Skin` НЕ снят и снят не будет: он стал тем, что сборка ПРОИЗВОДИТ. Пишутся и хранятся три
// записи, надевается — одна, и на корень уезжает одно опознание. Порождение, надевание,
// покрытие и читаемость работают ровно как работали — они и раньше принимали собранный вид.
//
// Это и есть ответ на вопрос «где `Skin` остаётся»: он перестал быть формой ЗАПИСИ и остался
// формой СБОРКИ.
//
// ## Сборка — настоящий шаг с отчётом, а не склейка текста
//
// Довод не в аккуратности. **Контраст перестал быть свойством части.** Форма, написанная под одну
// палитру, может лечь на другую — и тогда читаемость становится свойством СОЧЕТАНИЯ, а не палитры
// и не формы по отдельности. Считать её можно только на собранном наряде.
//
// Отсюда же и отказ ДО надевания: роль вне словаря, незакрытый словарь и имя, которого нет в
// источнике, — всё это изъяны сочетания, и узнать о них надо раньше, чем страница оделась.
//
// ## Порядок источников значения объявлен
//
//   палитра → форма → правка наряда
//
// Палитра даёт значение роли. Форма решает, куда роль легла, и вправе написать своё значение
// прямо в правиле — тогда палитра до этого свойства не достаёт. Правка наряда переопределяет
// роль В ГРАНИЦАХ ОДНОГО КОМПОНЕНТА и бьёт обе.
//
// Три места, откуда приходит значение, без объявленного порядка превращают вопрос «почему этот
// угол квадратный» в неотвечаемый. Порядок проверяется пробой, а не обещанием.

import { fluidPoles, isFluid, type FluidReport } from "./fluid.js";
import { motionsIn } from "./motion.js";
import type {
  Keyframes,
  LocalStyle,
  PartStyle,
  PartStyles,
  Skin,
  SkinVariables,
  SlotRecipe,
  StyleObject,
} from "./recipe.js";
import { trace } from "./trace.js";
import { homesText, partVariables, variableHomes } from "./variables.js";
import { knownRole, SCALE_ROLES, VOCABULARY } from "./vocabulary.js";
import type { PassportLookup } from "./address.js";

/**
 * ПАЛИТРА — словарь значений. Одна на наряд.
 *
 * Это прежние переменные скина, ставшие самостоятельной записью: шкалы семенами, размерные
 * семена, ряды литералами и правки тёмной половины. Формы её не копируют — они адресуют роли.
 */
export interface Palette extends SkinVariables {
  /** Имя палитры: им её называет наряд. */
  readonly name: string;
}

/**
 * ФОРМА — рецепт ОДНОГО компонента. Сколько угодно на компонент.
 *
 * Сколько угодно — потому что форм у кнопки может быть много: строгая, крупная, плоская. Это
 * разные записи, а не разные вариации внутри одной: вариации живут ВНУТРИ формы и принадлежат её
 * автору, а форма целиком принадлежит тому, кто одевает компонент.
 */
export interface Form {
  /** Имя формы: им её называет наряд. */
  readonly name: string;
  /** Компонент, который она одевает, — он же `data-scope` на его узлах. */
  readonly component: string;
  /** Рецепт: какая ступень куда легла. */
  readonly recipe: SlotRecipe;
  /** Именованные движения, которые употребляют её правила. */
  readonly keyframes?: Keyframes;
}

/**
 * НАРЯД — ссылки на палитру и формы плюс точечные правки. Один на приложение.
 *
 * ССЫЛКИ, А НЕ КОПИИ, и это несущее решение: копия убила бы пересев — поменял палитру, а в
 * нарядах её вчерашний слепок. Наряд хранит ИМЕНА, значения приезжают при сборке.
 */
export interface Outfit {
  /** Имя наряда: оно уезжает на корень одним опознанием. */
  readonly name: string;
  /** Имя палитры. Одна: две палитры в одном приложении — не эта волна. */
  readonly palette: string;
  /** Имена форм. Пусто — законный наряд, просто ничего не одевающий. */
  readonly forms: readonly string[];
  /**
   * ТОЧЕЧНЫЕ ПРАВКИ: компонент → роль → значение.
   *
   * «У таблицы скругления нет» — переопределение значения в границах одного компонента, а НЕ
   * новая форма: иначе у таблицы их станет двадцать, отличающихся одним числом.
   *
   * Действует внутри своего компонента и не действует за ним — это не соглашение, а устройство:
   * значение переобъявляется на координате компонента и наследуется его поддеревом.
   */
  readonly overrides?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/** Откуда сборка берёт записи по именам. Ровно то, что отдаёт хранилище. */
export interface LookParts {
  readonly palettes: readonly Palette[];
  readonly forms: readonly Form[];
}

/**
 * Имя изъяна наряда. Именованный отказ, а не `false`: редактор показывает человеку причину, а
 * проба проверяет ИМЕННО ТУ причину, ради которой написана.
 *
 *  • `unknown-palette`   — палитры с таким именем в источнике нет;
 *  • `unknown-form`      — формы с таким именем в источнике нет;
 *  • `unknown-component` — паспорта компонента нет вовсе (`PWEB-95`);
 *  • `outside-vocabulary` — роль вне словаря: у формы, у палитры или у правки;
 *  • `palette-incomplete` — палитра не закрыла словарь;
 *  • `component-twice`   — две формы на один компонент: чей вид победит, наряд не говорит;
 *  • `variable-elsewhere` — переменная объявлена паспортом, но НА ДРУГОЙ ЧАСТИ (`PWEB-93`).
 *
 * Предпоследнее — отдельное имя, а не оттенок `outside-vocabulary`, и это решение. Причины разные
 * и починки разные: «нет такого имени» чинят объявлением в палитре или в паспорте, а «объявлено,
 * но не здесь» — переносом правила на ту часть либо адресом по предку. Оставь мы одно имя на два
 * случая, человек пошёл бы дописывать роль в палитру, которой она не принадлежит.
 *
 * ## `unknown-component` — то же имя, что у порождения, и это ТОЖЕ решение
 *
 * Правило одно и то же: разными имена делают разные ПОЧИНКИ. Здесь починка одна — объявить паспорт
 * в ките, — и порождение эту причину уже называет так (`rules.ts`). Заведи мы синоним, у одного
 * случая стало бы два слова, и половина механики, говорящая с человеком в редакторе, называла бы
 * его иначе, чем половина, печатающая CSS.
 *
 * До `PWEB-95` наряд отвечал на этот случай `outside-vocabulary` по каждой переменной формы —
 * формально не ложь, но названа не причина: чинить надо паспорт, а человек по такому тексту шёл в
 * палитру.
 */
export type OutfitFlawName =
  | "unknown-palette"
  | "unknown-form"
  | "unknown-component"
  | "outside-vocabulary"
  | "palette-incomplete"
  | "component-twice"
  | "variable-elsewhere";

/** Изъян наряда: имя, место в записи и пояснение человеку. */
export interface OutfitFlaw {
  readonly name: OutfitFlawName;
  /** Место в записи: `forms[2]`, `overrides.table.radius-md`, `palette`. */
  readonly where: string;
  /** Что это значит человеку и редактору. */
  readonly means: string;
}

/** ОТЧЁТ СБОРКИ — то, ради чего сборка и объявлена шагом, а не склейкой. */
export interface OutfitReport {
  /** Имя палитры, на которой собрано. */
  readonly palette: string;
  /** Компоненты, у которых есть форма. Перечнем, а не числом. */
  readonly dressed: readonly string[];
  /**
   * СЧЁТ ТОЧЕЧНЫХ ПРАВОК — значением, а не выводом в консоль.
   *
   * Полезен сам по себе: сорок исключений означают, что палитра выбрана неверно. Механика
   * сообщает счёт, а не запрещает: что делать с числом, решает человек.
   */
  readonly overrides: number;
  /** Правки по компонентам: кому сколько. Сорок у одного и сорок у сорока — разные болезни. */
  readonly overridesBy: Readonly<Record<string, number>>;
  /**
   * ТЕКУЧИЕ СЕМЕНА — вычисленное значение на каждом полюсе (`PWEB-80`).
   *
   * Отчёт, а не отказ, и там, где отказывать не по чему: пола у кегля нет, и назначить его самим
   * значило бы решить за автора, каким должен быть вид. Но одиннадцать пикселей на узком полюсе
   * автор обязан увидеть ПРИ ЗАПИСИ, а не найти на телефоне.
   */
  readonly fluid: readonly FluidReport[];
}

/** Что вышло из сборки: надеваемый вид и отчёт о том, из чего он сложился. */
export interface Assembled {
  readonly skin: Skin;
  readonly report: OutfitReport;
}

/**
 * ОТКАЗ СБОРКИ: наряд с изъянами в надеваемый вид не превращается.
 *
 * Исключением, а не значением, — по той же причине, по которой так устроено порождение: изъян,
 * отданный рядом с результатом, вызывающий волен не смотреть, и тогда «форма попросила роль,
 * которой нет» доедет до страницы, где выглядит как испорченный вид.
 *
 * Кому нужен перечень, а не отказ, зовёт `checkOutfit`: это тот же обход, и второй правды о
 * законности наряда в зоне нет.
 */
export class OutfitRefused extends Error {
  readonly flaws: readonly OutfitFlaw[];

  constructor(name: string, flaws: readonly OutfitFlaw[]) {
    super(
      `[probe-web-skin] наряд «${name}» не собран: ${flaws.length} изъян(ов).\n` +
        flaws.map((flaw) => `  • ${flaw.name} — ${flaw.where}: ${flaw.means}`).join("\n"),
    );
    this.name = "OutfitRefused";
    this.flaws = flaws;
  }
}

/** Имя роли без `--`, в каком бы начертании его ни написали. */
function bare(name: string): string {
  return name.startsWith("--") ? name.slice(2) : name;
}

/**
 * Роли, которые палитра задаёт ПОИМЁННО: литералы обеих половин и размерные семена.
 *
 * Имена шкал сюда НЕ входят: `акцент` — не роль, а семья ролей (`акцент-9`, `акцент-contrast`, …).
 * Спроси мы про них словарь ролей — он честно ответил бы «такой роли нет», и палитра, написанная
 * ровно по контракту, оказалась бы невалидной.
 */
function paletteValues(palette: Palette): Set<string> {
  const роли = new Set<string>();

  for (const half of [palette.light, palette.dark]) {
    for (const name of Object.keys(half ?? {})) роли.add(bare(name));
  }

  for (const name of Object.keys(palette.dimensions ?? {})) роли.add(bare(name));

  return роли;
}

/** Ссылка формы на имя: где она стоит и на какой ЧАСТИ. */
interface FormReference {
  readonly name: string;
  /**
   * Часть, СЛОВАРЁМ КОТОРОЙ судится ссылка.
   *
   * У правила это часть, на которой оно стоит. У ступени именованного движения — часть, на
   * которой движение ПРИМЕНЕНО (`PWEB-101`): кадр разрешается на анимируемом узле, а не там, где
   * записан блок. `null` — движение не применено ни одним правилом: узла у него нет, и остаётся
   * общий словарь.
   */
  readonly part: string | null;
  readonly where: string;
  /** Имя движения — если ссылка приехала из его ступеней. Едет в сообщение: виноват не «где-то». */
  readonly movement?: string;
}

/**
 * Все блоки свойств внутри вида одной части: свои, состояний и правил по предку.
 *
 * Нужны ровно для одного вопроса — ГДЕ применено движение (`PWEB-101`), — и потому собираются
 * блоками, а не текстом: спрашивать надо СВОЙСТВО (`animation`), а поиск по строке принял бы за
 * применение любое совпадение имени.
 *
 * Правило по предку одевает по-прежнему НАШУ часть, значит и движение в нём применено на ней же.
 */
function propsIn(style: LocalStyle | PartStyle): StyleObject[] {
  const found: StyleObject[] = [];

  if (style.props) found.push(style.props);
  for (const nested of Object.values(style.states ?? {})) found.push(...propsIn(nested));
  for (const ancestor of (style as PartStyle).ancestors ?? []) found.push(...propsIn(ancestor.style));

  return found;
}

/**
 * ВСЕ ГРУППЫ `PartStyles` В РЕЦЕПТЕ — база, настройки, вариации, пересечения, с местом каждой.
 *
 * Заведена ПОСЛЕ того, как `formRefs` и `motionParts` уже существовали порознь (`PWEB-101`), и
 * `settings` (`PWEB-103`) приехал в рецепт, не приехав в этот перечень: обе функции продолжали
 * обходить старые три группы и молча пропускали четвёртую. Запись под настройкой оставалась
 * НЕПРОВЕРЕННОЙ до сборки — ни ссылки на роли, ни законность движения, — и находилась это ровно
 * тем способом, каким такие пробелы и находятся: настоящей записью, которая не должна была
 * пройти (`PWEB-105`).
 *
 * Перечень один на обоих читателей: разъедься он снова на два обхода, третье поле рецепта
 * когда-нибудь повторит эту же историю в третий раз.
 */
function recipeGroups(recipe: SlotRecipe): { where: string; styles: PartStyles }[] {
  const groups: { where: string; styles: PartStyles }[] = [];

  if (recipe.base) groups.push({ where: "base", styles: recipe.base });

  for (const [setting, byValue] of Object.entries(recipe.settings ?? {})) {
    for (const [value, styles] of Object.entries(byValue)) {
      groups.push({ where: `settings.${setting}.${value}`, styles });
    }
  }

  for (const [name, styles] of Object.entries(recipe.variants ?? {})) {
    groups.push({ where: `variants.${name}`, styles });
  }

  (recipe.compoundVariants ?? []).forEach((compound, index) => {
    groups.push({ where: `compoundVariants[${index}]`, styles: compound.style });
  });

  return groups;
}

/**
 * ГДЕ ФОРМА ПРИМЕНЯЕТ каждое движение: имя движения → части, на которых стоит `animation:`.
 *
 * Обход свой, а не общий с порождением, по той же причине, что и у `formRefs`: скина здесь ещё
 * нет. Общий у них ОТВЕТ — что в блоке свойств считается применением движения (`motionsIn`), — и
 * второй его копии быть не должно: разъехавшись, они назвали бы одну запись законной до сборки и
 * незаконной после.
 */
function motionParts(form: Form): Map<string, Set<string>> {
  const declared = new Set(Object.keys(form.keyframes ?? {}));
  const found = new Map<string, Set<string>>();

  if (declared.size === 0) return found;

  for (const { styles } of recipeGroups(form.recipe)) {
    for (const [part, style] of Object.entries(styles)) {
      for (const props of propsIn(style)) {
        for (const movement of motionsIn(props, declared)) {
          found.set(movement, (found.get(movement) ?? new Set<string>()).add(part));
        }
      }
    }
  }

  return found;
}

/** Имена из `var(--…)` в одном куске записи. */
function refsIn(value: unknown): string[] {
  return [...JSON.stringify(value ?? null).matchAll(/var\(\s*(--[^\s,)]+)/gu)].map((m) =>
    bare(m[1]!),
  );
}

/**
 * Ссылки формы — С УКАЗАНИЕМ ЧАСТИ, на которой они стоят.
 *
 * Часть здесь несущая, а не для сообщения: переменная паспорта законна на СВОЕЙ части и незаконна
 * на соседней (`PWEB-93`). Пропусти мы имя без части — правило поехало бы на страницу с
 * неразрешимым значением, и мы вернулись бы к тому, от чего уходим, только тише.
 *
 * Обход СВОЙ, а не общий с порождением, и причина названа: порождение разворачивает рецепт в
 * правила и требует собранный скин, а здесь скина ещё нет — наряд проверяется ДО сборки. Общее у
 * них не обход, а ОТВЕТ о законности: он один и живёт в `variables.ts`.
 *
 * Состояния и предки лежат внутри стиля своей части: правило «эта часть при таком предке» одевает
 * по-прежнему её, значит и словарь у него её.
 */
function formRefs(form: Form): FormReference[] {
  const found: FormReference[] = [];

  for (const { where, styles } of recipeGroups(form.recipe)) {
    for (const [part, style] of Object.entries(styles)) {
      for (const name of refsIn(style)) found.push({ name, part, where: `${where}.${part}` });
    }
  }

  // ДВИЖЕНИЕ СУДЯТ ПО МЕСТУ ПРИМЕНЕНИЯ (`PWEB-101`). Прежде здесь стояло «переменной части в нём
  // быть не может: ставить её было бы некому» — и это оказалось неверно ровно наоборот: ставит её
  // кит на том самом узле, где движение и применено. Блок `@keyframes` сам по себе не одевает
  // ничего, а `var()` внутри кадра разрешается на анимируемом элементе.
  const применено = motionParts(form);

  for (const [movement, frames] of Object.entries(form.keyframes ?? {})) {
    const части = [...(применено.get(movement) ?? [])];
    const where = `keyframes.${movement}`;

    for (const name of refsIn(frames)) {
      // Не применено — узла нет, и словарь остаётся общим: судим как прежде.
      if (части.length === 0) {
        found.push({ name, part: null, where });
        continue;
      }

      // Применено на нескольких — законно там, где законно у каждой: спрашиваем по одному разу
      // за часть, и незаконная назовётся своим именем, не утянув за собой законную.
      for (const part of части) found.push({ name, part, where, movement });
    }
  }

  return found;
}

/**
 * Роли-шкалы, которые палитра закрывает семенами: имя шкалы даёт все её ступени разом.
 *
 * Считается по ИМЕНИ шкалы, а не по построенным значениям: значения строит порождение, а словарь
 * спрашивают до него — иначе «палитра неполна» узнавалось бы уже на странице.
 */
function closedByScales(palette: Palette): Set<string> {
  const закрыто = new Set<string>();

  for (const scale of Object.keys(palette.scales ?? {})) {
    for (const роль of VOCABULARY) {
      if (роль.kind === "color" && роль.name.startsWith(`${scale}-`)) закрыто.add(роль.name);
    }
  }

  return закрыто;
}

/**
 * Роли, которые палитра закрывает размерными семенами: семя даёт всю свою лестницу.
 *
 * Форма шкалы приходит данными зоны значений, поэтому и перечень ступеней берётся оттуда же —
 * через словарь, а не вторым списком.
 */
function closedByDimensions(palette: Palette): Set<string> {
  const закрыто = new Set<string>();
  const посеяно = new Set(Object.keys(palette.dimensions ?? {}));

  for (const роль of VOCABULARY) {
    if (роль.kind !== "size") continue;
    if (посеяно.has(роль.name)) закрыто.add(роль.name);
    // Ступень закрыта, если посеяно её семя: `space` даёт `space-1`…`space-32`.
    for (const семя of посеяно) {
      if (роль.name.startsWith(`${семя}-`)) закрыто.add(роль.name);
    }
  }

  return закрыто;
}

/**
 * Собирает недостающие роли ПО СЕМЬЯМ: «успех (13), предупреждение (13)» вместо первых восьми
 * имён подряд.
 *
 * Разница не в красоте. Тринадцать ступеней одной непосеянной шкалы — это ОДНА недоделка, а не
 * тринадцать, и перечень имён подряд её прячет: обрежется он на первой же шкале, и человек
 * починит одну, не узнав о второй. Ровно на этом проба и поймала прежнюю форму сообщения.
 */
function поСемьям(роли: readonly string[]): string {
  const семьи = new Map<string, number>();

  for (const роль of роли) {
    const семья = SCALE_ROLES.find((scale) => роль.startsWith(`${scale}-`)) ?? роль;
    семьи.set(семья, (семьи.get(семья) ?? 0) + 1);
  }

  const названо = [...семьи].map(([семья, счёт]) => (счёт > 1 ? `${семья} (${счёт})` : семья));

  return названо.length > 12 ? `${названо.slice(0, 12).join(", ")}, …` : названо.join(", ");
}

/**
 * Перечень изъянов наряда — тот же обход, что делает сборка, но значением.
 *
 * @param outfit наряд
 * @param parts откуда брать палитру и формы по именам
 * @param lookup чем найти паспорт по имени компонента. Наружу эта подпись не выходит: источник
 *   приезжает связкой `withPassports`, и он же уходит в порождение (`PWEB-94`)
 * @returns все изъяны сразу: человек чинит запись целиком, а не по одному
 */
export function checkOutfit(
  outfit: Outfit,
  parts: LookParts,
  lookup: PassportLookup,
): readonly OutfitFlaw[] {
  const done = trace(`checkOutfit(${outfit.name})`);
  const flaws: OutfitFlaw[] = [];
  // Паспорта приходят от СВЯЗКИ (`withPassports`), а не доводом потребителя: источник называется
  // один раз, и разойтись с порождением ему теперь нечем — это держит подпись, а не комментарий
  // (`PWEB-94`). Необязательным его не сделать тем более: завёлся бы второй путь — проверка без
  // паспортов, законная по подписи и слепая по делу (`PWEB-93`).
  const дома = variableHomes(
    lookup,
    parts.forms.filter((form) => outfit.forms.includes(form.name)).map((form) => form.component),
  );

  const palette = parts.palettes.find((кандидат) => кандидат.name === outfit.palette);

  if (!palette) {
    flaws.push({
      name: "unknown-palette",
      where: "palette",
      means:
        `палитры «${outfit.palette}» в источнике нет. Наряд ссылается ИМЕНЕМ, и имя, которого ` +
        "никто не отдаёт, — это вид, которого не будет",
    });
  }

  if (palette) {
    // Шкала вне контракта: имя семьи ролей спрашивается у перечня ролей-шкал, а не у перечня
    // ролей. Семья и роль — разные вещи, и путать их значило бы отвергать верную палитру.
    for (const scale of Object.keys(palette.scales ?? {})) {
      if (!SCALE_ROLES.includes(scale)) {
        flaws.push({
          name: "outside-vocabulary",
          where: `palette.scales.${scale}`,
          means:
            `палитра задаёт шкалу «${scale}», которой в словаре нет. Роли-шкалы объявлены по ` +
            `назначению (${SCALE_ROLES.join(", ")}), и форма попросит только их`,
        });
      }
    }

    // Палитра задаёт роль вне словаря: значение, которого ни одна форма не вправе попросить.
    for (const роль of paletteValues(palette)) {
      if (!knownRole(роль)) {
        flaws.push({
          name: "outside-vocabulary",
          where: `palette.${роль}`,
          means:
            `палитра задаёт роль «${роль}», которой в словаре нет. Форма попросить её не сможет ` +
            "— значит значение никуда не приедет, и это будет тихо",
        });
      }
    }

    // Палитра, не закрывшая словарь, НЕПОЛНА — и это названо до надевания.
    const закрыто = new Set([
      ...paletteValues(palette),
      ...closedByScales(palette),
      ...closedByDimensions(palette),
    ]);
    const нехватка = VOCABULARY.filter((роль) => !закрыто.has(роль.name)).map((роль) => роль.name);

    if (нехватка.length > 0) {
      flaws.push({
        name: "palette-incomplete",
        where: "palette",
        means:
          `палитра «${palette.name}» не закрыла словарь: не задано ${нехватка.length} рол(ей) — ` +
          `${поСемьям(нехватка)}. Форма, написанная под другую палитру, потеряла бы на ней часть ` +
          "значений молча",
      });
    }
  }

  const собрано: Form[] = [];
  const занято = new Map<string, string>();

  outfit.forms.forEach((имя, индекс) => {
    const form = parts.forms.find((кандидат) => кандидат.name === имя);

    if (!form) {
      flaws.push({
        name: "unknown-form",
        where: `forms[${индекс}]`,
        means: `формы «${имя}» в источнике нет — наряд ссылается на то, чего никто не отдаёт`,
      });
      return;
    }

    const прежняя = занято.get(form.component);
    if (прежняя !== undefined) {
      flaws.push({
        name: "component-twice",
        where: `forms[${индекс}]`,
        means:
          `на компонент «${form.component}» наряд назвал две формы — «${прежняя}» и «${имя}». ` +
          "Чей вид победит, наряд не говорит, а каскад ответил бы порядком — то есть случайно",
      });
      return;
    }

    занято.set(form.component, имя);
    собрано.push(form);

    const passport = lookup(form.component);

    // ПАСПОРТА НЕТ ВОВСЕ — причина, а не следствие (`PWEB-95`). Ссылки формы дальше не
    // перебираются намеренно: без паспорта переменные части прочитать неоткуда, и каждая из них
    // приехала бы человеку как «роли нет ни в словаре, ни в паспорте» — пачка следствий вместо
    // одной причины. Порождение на этот случай отвечает так же и тем же именем (`rules.ts`).
    if (!passport) {
      flaws.push({
        name: "unknown-component",
        where: `forms[${индекс}]`,
        means:
          `паспорта компонента «${form.component}» нет: ни частей, ни состояний, ни объявленных ` +
          "переменных прочитать неоткуда. Чинится в ките — объявлением паспорта, а не в палитре",
      });
      return;
    }

    for (const ссылка of formRefs(form)) {
      if (knownRole(ссылка.name)) continue;

      // Переменная, объявленная ЭТОЙ частью, законна: кит её ставит, и паспорт это объявил.
      // Роли она при этом не становится — палитра её не задаёт и задать не может.
      if (ссылка.part && partVariables(passport, ссылка.part).has(`--${ссылка.name}`)) continue;

      // ВИНОВАТЫЙ НАЗЫВАЕТСЯ ЦЕЛИКОМ (`PWEB-101`): у ссылки из ступеней движения виноваты двое —
      // само движение и та часть, на которой его применили, — и человеку нужны оба. Без части он
      // не знает, куда переносить `animation:`; без движения — какой блок кадров смотреть.
      const место = ссылка.movement
        ? `движение «${ссылка.movement}» применено на части «${ссылка.part}», а `
        : "";

      const где = дома.get(`--${ссылка.name}`);
      if (где) {
        flaws.push({
          name: "variable-elsewhere",
          where: `forms[${индекс}].${ссылка.where}.${ссылка.name}`,
          means:
            `${место}переменную «--${ссылка.name}» объявляет паспорт, но на другой части — ` +
            `${homesText(где)}. Здесь её никто не ставит: правило приедет на страницу с ` +
            "неразрешимым значением. Перенеси правило на ту часть либо адресуй её по предку",
        });
        continue;
      }

      flaws.push({
        name: "outside-vocabulary",
        where: `forms[${индекс}].${ссылка.where}.${ссылка.name}`,
        means:
          `${место}форма просит роль «${ссылка.name}», которой нет ни в словаре, ни в паспорте. ` +
          "Ни одна палитра её не задаст, и правило приедет на страницу с неразрешимым значением",
      });
    }
  });

  for (const [component, правки] of Object.entries(outfit.overrides ?? {})) {
    // Та же причина и то же имя, что у формы выше. Правка адресуется КООРДИНАТОЙ компонента, и
    // собрать её без паспорта нечем: печать такую правку молча пропускает, ссылаясь на то, что
    // изъян назовёт проверка наряда, — до `PWEB-95` не называл никто, и правка пропадала тихо.
    if (!lookup(component)) {
      flaws.push({
        name: "unknown-component",
        where: `overrides.${component}`,
        means:
          `паспорта компонента «${component}» нет: адрес правке собрать не из чего, и на страницу ` +
          "она не приедет вовсе. Чинится в ките — объявлением паспорта",
      });
    }

    for (const роль of Object.keys(правки)) {
      if (!knownRole(роль)) {
        flaws.push({
          name: "outside-vocabulary",
          where: `overrides.${component}.${роль}`,
          means:
            `правка задаёт роль «${роль}», которой в словаре нет. Переопределять нечего: такой ` +
            "роли не задаёт палитра и не просит ни одна форма",
        });
      }
    }
  }

  done();
  return flaws;
}

/**
 * СБОРКА наряда в надеваемый вид.
 *
 * Настоящий шаг с отчётом, а не склейка текста: здесь и только здесь сходятся три записи, и
 * только здесь можно спросить то, что стало свойством СОЧЕТАНИЯ, — читаемость и покрытие.
 * Считать их по части нельзя: форма, написанная под одну палитру, на другой читается иначе.
 *
 * @param outfit наряд — ссылки и правки
 * @param parts откуда брать палитру и формы по именам
 * @param lookup чем найти паспорт по имени компонента. Наружу эта подпись не выходит: источник
 *   приезжает связкой `withPassports`, и он же уходит в порождение (`PWEB-94`)
 * @returns надеваемый вид и отчёт о сборке
 * @throws {OutfitRefused} если в наряде есть хоть один изъян
 */
export function assemble(outfit: Outfit, parts: LookParts, lookup: PassportLookup): Assembled {
  const done = trace(`assemble(${outfit.name})`);

  const flaws = checkOutfit(outfit, parts, lookup);
  if (flaws.length > 0) throw new OutfitRefused(outfit.name, flaws);

  const palette = parts.palettes.find((кандидат) => кандидат.name === outfit.palette)!;
  const forms = outfit.forms.map(
    (имя) => parts.forms.find((кандидат) => кандидат.name === имя)!,
  );

  const fluid = Object.entries(palette.dimensions ?? {})
    .filter(([, declaration]) => isFluid(declaration))
    .map(([seed, declaration]) => fluidPoles(seed, declaration as never))
    .filter((отчёт): отчёт is FluidReport => отчёт !== null);

  const overridesBy: Record<string, number> = {};
  for (const [component, правки] of Object.entries(outfit.overrides ?? {})) {
    overridesBy[component] = Object.keys(правки).length;
  }

  const skin: Skin = {
    // Имя НАРЯДА, а не палитры и не формы: на корень уезжает одно опознание, и это оно.
    name: outfit.name,
    variables: {
      scales: palette.scales,
      dimensions: palette.dimensions,
      light: palette.light,
      dark: palette.dark,
    },
    recipes: Object.fromEntries(forms.map((form) => [form.component, form.recipe])),
    keyframes: Object.assign({}, ...forms.map((form) => form.keyframes ?? {})) as Keyframes,
    overrides: outfit.overrides,
  };

  done();
  return {
    skin,
    report: {
      palette: palette.name,
      // Перечень, а не число: число устаревает при добавлении каждого следующего компонента.
      dressed: forms.map((form) => form.component).toSorted(),
      overrides: Object.values(overridesBy).reduce((сумма, счёт) => сумма + счёт, 0),
      overridesBy,
      fluid,
    },
  };
}
