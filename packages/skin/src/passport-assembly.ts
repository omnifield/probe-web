// БАЗОВАЯ СБОРКА — как выглядит РАБОЧИЙ экземпляр компонента (`PWEB-89`), и РОД содержимого —
// чем узел является, когда его кладут внутрь чужого узла (`PWEB-24`).
//
// ## Срез редактора, не рантайма (`PWEB-115`)
//
// Ни сборку, ни правило вложенности `generateSkinCss`/`checkOutfit`/`assemble` не читают —
// проверено по всей механике скина. Читает их только `RenderTree`/`baseAssemblyOf`, а это
// редакторская механика продукта. Файл остаётся файлом (типы одного домена — дерева сборки и рода
// содержимого — исторически и логически связаны), но НАРУЖУ он идёт только подпутём `./editor`
// — модель и корневой вход (`./model`, `.`) его больше не видят.
//
// ## Что это чинит
//
// Чтобы показать гармошку, витрина должна была бы выдумывать: сколько разделов, какие пропы дать
// киту, чтобы тот вообще заработал (`value` у раздела — без него Ark не знает, какой пункт
// раскрывать), чем наполнить части. Это знание о компоненте, и у витрины его быть не должно:
// следующий пульт напишет своё, поставщик выпустит четвёртую часть — и оба покажут её пустой,
// каждый по-своему.
//
// Даёт сборку тот, кто компонент написал. Кастомные сборки остаются потребителю.
//
// ## Форма: объявление вложенное, выход — плоский
//
// Объявляют вложенным деревом ЧАСТЕЙ (`PassportAssembly`): так его пишут и читают глазами.
// Отдаётся плоская карта с корнем (`BaseAssemblyTree`) — та форма, в которой дерево читает
// механика сборки. Имена узлов, обратные ссылки и адреса частей ставит `baseAssemblyOf`, а не
// рука: написанные руками, они разъехались бы с анатомией на первой же правке.
//
// ## Почему выход — ЧУЖАЯ форма, объявленная у нас
//
// Условие задачи: сборка обязана собираться механикой сборки БЕЗ доработки потребителем, иначе
// это не сборка, а описание. Значит отдавать надо ровно то, что механика принимает.
//
// Приём не новый и не наш: механика сборки ровно так же объявляет у себя `ReadablePassport` —
// самую узкую запись того, что она с паспорта снимает, — вместо того чтобы зависеть на форму.
// Здесь то же самое, зеркально: узкая запись того, что мы отдаём, вместо зависимости на
// механику. Зависеть на неё форма и не может — направление зависимостей одностороннее.
//
// Совпадение двух записей держится не договорённостью, а пробой у ЧИТАТЕЛЯ: дерево, поданное в
// `RenderTree`, либо типизируется, либо нет. Пробы этой у нас нет и быть не может (форма не
// вправе тянуть механику даже в пробы — это замкнуло бы граф зависимостей), поэтому она названа
// в отчёте по задаче как долг читающей зоны.
//
// ## Сборок стало МНОГО (`PWEB-115`)
//
// Раньше сборка была одна: перечень сборок превратил бы паспорт в витрину, а витрина — не предмет
// паспорта. Решение пересмотрено: витриной сборки становится не паспорт, а компонент, у которого
// им И ПОЛОЖЕНО быть несколько («три раздела, первый раскрыт» / «пять разделов, все закрыты») —
// разбор на настоящих данных гармошки за следующей задачей. Здесь меняется только ФОРМА: держатель
// сборки (`PassportEditorInfo.assemblies`, в `passport-editor.ts`) стал перечнем ОДНОГО и того же
// типа `PassportAssembly`, а не полем с ним одним.
//
// ## Адрес компонента — вход, а не константа
//
// В реестре компонент может лежать под чужим пространством имён (`ui.accordion`): адрес — дело
// того, кто реестр складывает. Поэтому адрес приходит параметром, а внутри дерева части
// адресуются от него; зашей мы `accordion.itemTrigger` в объявление — сборка сломалась бы у
// первого же потребителя, который положил кит не под голым именем.

import type { ComponentPassport } from "./passport-form.js";

/**
 * РОД содержимого — чем узел является, когда его кладут внутрь чужого узла.
 *
 * Род, а не имя компонента. «Внутрь кнопки только текст или значок» — утверждение о роде
 * допустимого, и записать его иначе нечем: перечень имён отстанет на первом же новом значке.
 *
 * Форма взята, а не придумана (сверено 2026-08-20): в HTML `<button>` пускает внутрь phrasing
 * content — КАТЕГОРИЮ содержимого, а не список тегов; в схеме ProseMirror узел объявляет свою
 * группу (`group`), а родитель — допустимые группы (`content`). Обе стороны там же, где у нас:
 * кандидат называет себя сам, принимающий называет род.
 *
 *  • `text` — подпись: узел-текст, компонентом не являющийся;
 *  • `icon` — значок: компонент, предмет которого — один символ;
 *  • `component` — любой компонент. Значок подходит сюда; обратное неверно.
 *
 * Новый род заводится ТОЛЬКО решением — как и новое имя состояния. Перечень родов маленький
 * намеренно: он про то, ЧЕМ вещь является, а не про то, что она умеет.
 */
export type PassportGenus = "text" | "icon" | "component";

/** Род, которым компонент может БЫТЬ. Текстом — не может: текст это узел, а не компонент. */
export type PassportComponentGenus = Exclude<PassportGenus, "text">;

/**
 * Что допустимо внутри части — ОДНИМ перечнем: свои части и содержимое потребителя вперемешку.
 *
 * Перечень один намеренно (`PWEB-24`). Часть компонента и есть вложенный компонент, увиденный с
 * другой стороны: у Ark вкладка гармошки — и часть `item`, и самостоятельный компонент. Разведи
 * это на два поля — и у одного дерева окажется два правила, которые редактор обязан складывать
 * сам; складывать он их будет по-своему, и каждый читатель паспорта по-своему же.
 */
export type PassportAdmission<Part extends string = string> =
  | {
      /** Своя часть этого же компонента. */
      readonly kind: "part";
      /** Имя части — ключ анатомии, не новое объявление. */
      readonly name: Part;
    }
  | {
      /** Содержимое потребителя — названное родом. */
      readonly kind: "content";
      readonly genus: PassportGenus;
    }
  | {
      /** Вспомогательный компонент кита — БЕЗ адреса анатомии (`PassportAssemblyExtra`). */
      readonly kind: "extra";
      /** Имя в карте `extras` поставщика — не часть анатомии, отдельное пространство имён. */
      readonly name: string;
    };

/**
 * Род кандидата → рода, под которые он подходит.
 *
 * Значок — тоже компонент, и место, объявленное «под любой компонент», он занимать вправе.
 * Обратно не работает: место под значок компонентом вообще не занимается, иначе «только текст
 * или значок» не отвергало бы ничего.
 */
const FITS: Record<PassportGenus, readonly PassportGenus[]> = {
  text: ["text"],
  icon: ["icon", "component"],
  component: ["component"],
};

/** То немногое, что `admits` спрашивает у части: правило вложенности, если оно объявлено. */
export interface PassportPartAdmission<Part extends string = string> {
  readonly accepts?: readonly PassportAdmission<Part>[];
}

/**
 * Пускает ли часть внутрь себя кандидата.
 *
 * Решение машинное, и в этом весь смысл поля: редактор обязан уметь ОТВЕРГНУТЬ заведомо неверное
 * вложение, а не только показать, что «что-то класть можно».
 *
 * Живёт рядом с родом и сборкой, а не у читателя паспорта: правило одно на всех читателей —
 * редактор, `defineEditorInfo`, — и написанное вторым читателем разъедется с написанным первым
 * молча, оба будут зелёными.
 *
 * @param part часть, ВНУТРЬ которой кладут — точнее, её правило вложенности из среза редактора
 * @param candidate что кладут: своя часть по имени либо содержимое рода (род компонента берётся
 *   из его же среза редактора — `editorInfo.genus`, не из имени пакета)
 */
export function admits<Part extends string>(
  part: PassportPartAdmission<Part>,
  candidate: PassportAdmission<Part>,
): boolean {
  const accepts = part.accepts;

  if (!accepts) return true;

  return accepts.some((allowed) => {
    if (candidate.kind === "part") return allowed.kind === "part" && allowed.name === candidate.name;
    if (candidate.kind === "extra") return allowed.kind === "extra" && allowed.name === candidate.name;
    return allowed.kind === "content" && FITS[candidate.genus].includes(allowed.genus);
  });
}

/**
 * Узел объявления: ЧАСТЬ компонента со своими пропами и детьми.
 *
 * Имени у узла нет: имена ставит `baseAssemblyOf`, и ставит так же, как их ставит образец
 * механики — именем части, а при повторе с числом. Совпадение здесь не украшение: человек,
 * увидевший `item-2` в одном месте и `item-2` в другом, вправе считать, что это одно и то же.
 */
export interface PassportAssemblyPart<Part extends string = string> {
  /** Часть анатомии. Часть, которой в анатомии нет, не наберётся типом и отвергается сборкой. */
  readonly part: Part;
  /**
   * Пропы, без которых кит не заработает.
   *
   * НЕ вид и не состояние: это то, что потребитель обязан передать компоненту, чтобы тот
   * работал. Раскрытость, наведение, отключённость — состояния, у них своя ось и свои средства;
   * подмени мы их пропом здесь — базовая сборка отвечала бы состоянием на вопрос о виде.
   */
  readonly props?: Readonly<Record<string, unknown>>;
  /**
   * Пропы, чьё значение резолвится из данных при отрисовке (`PWEB-156`) — имя пропа → путь.
   *
   * ОТДЕЛЬНОЕ поле, а не «значение пропа бывает и строкой, и `{path}`»: `props` остаётся ВСЕГДА
   * литералом, и угадывать по форме значения, ссылка это или обычный объектный проп (`style`,
   * например), не приходится — второй смысл у одной и той же формы был бы источником путаницы,
   * которого у `props` не было никогда. Резолвится `RenderTree`, добавляется к `props` поверх
   * (побеждает при совпадении имени — привозит актуальное данными, там где `props` привёз бы
   * умолчание).
   */
  readonly bind?: Readonly<Record<string, string>>;
  /**
   * Событие узла наружу (`PWEB-157`) — родное DOM-событие → что об этом сказать вызывающему.
   * Ключ — `click`/`change`/`input`/`submit`; значение — форма A2UI (`Action`, `README`
   * `packages/assembly`). Отсутствует — узел ведёт себя как раньше, никакого события не шлёт.
   */
  readonly on?: Readonly<Record<string, DispatchAction>>;
  /** Части и содержимое внутри — ОДНИМ списком, в том порядке, в каком их видно. */
  readonly children?: readonly PassportAssemblyNode<Part>[];
}

/**
 * Ссылка на значение во ВНЕШНИХ данных — JSON Pointer (RFC 6901), тем же приёмом, что у A2UI
 * (`PWEB-156`, решение изучено и записано в README `packages/assembly` — не изобретаем свою
 * форму). Узкая запись того же понятия, что и в `packages/assembly/src/tree.ts` — зеркально
 * тому, как реестр уже держит свою узкую запись пары поставщика: механика не зависит на форму
 * скина, форма скина не зависит на механику.
 */
export interface DataBinding {
  readonly path: string;
}

/** Значение содержимого: готовый литерал ЛИБО ссылка на данные, разрешаемая при отрисовке. */
export type DynamicValue = string | DataBinding;

/** Ссылка ли это на данные — по наличию `path`. */
export function isDataBinding(value: DynamicValue): value is DataBinding {
  return typeof value === "object" && value !== null && "path" in value;
}

/**
 * Значение по пути в данных — RFC 6901 JSON Pointer (`/a/b/0`, `~0`→`~`, `~1`→`/`).
 *
 * Узкая копия того же самого в `packages/assembly/src/tree.ts` — тем же приёмом, что и у
 * остального в этом файле (форма отдана обоим читателям порознь, зависимости друг на друга нет).
 * Здесь она нужна только для `baseAssemblyOf`: узнать длину массива под повтором (`PWEB-156`),
 * резолвинг СОДЕРЖИМОГО для показа — дело `RenderTree`, не разворота дерева.
 *
 * @param data объект данных
 * @param path JSON Pointer; пустая строка указывает на сами данные целиком
 */
export function resolveDataBinding(data: unknown, path: string): unknown {
  if (path === "") return data;
  if (!path.startsWith("/")) return undefined;

  let current: unknown = data;
  for (const raw of path.slice(1).split("/")) {
    const segment = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = Number(segment);
      current = Number.isInteger(index) ? current[index] : undefined;
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Событие узла наружу (`PWEB-157`) — форма A2UI (`Action`, `{event: {name, context}}`), сверенная
 * по их настоящему исходнику (`renderers/web_core/src/v0_9/schema/common-types.ts`), не
 * придумана заново. `functionCall`-вариант (вызов клиентской функции по имени) сюда НЕ завозится
 * — этот случай в кит не нужен, пока для него нет потребителя (тот же довод, что и у `call` в
 * `DynamicValue`).
 */
export interface DispatchAction {
  readonly event: {
    /** Имя события — то, что увидит вызывающий `dispatch`, не имя DOM-события. */
    readonly name: string;
    /**
     * Данные вместе с событием — карта, РЕЗОЛВИТСЯ до отправки (тем же приёмом, что и `bind`):
     * вызывающий получает готовый JSON, не сырое DOM-событие, — движок не отдаёт наружу то, чего
     * сам не понимает.
     */
    readonly context?: Readonly<Record<string, DynamicValue>>;
  };
}

/**
 * Узел объявления: СОДЕРЖИМОЕ — значение, названное родом.
 *
 * Дискриминант — наличие рода, как и в дереве механики: там текстовый узел отличается от
 * элемента ровно этим, и там же записано, откуда форма взята (Slate, ProseMirror, DOM).
 */
export interface PassportAssemblyContent {
  /** Чем значение является. Значка среди родов узла нет: значок — компонент, он приходит частью. */
  readonly genus: PassportGenus;
  /**
   * Значение — то, что видно человеку. У рода `text` это подпись.
   *
   * Литерал ИЛИ ссылка на данные (`DynamicValue`, `PWEB-156`) — второе разрешается `RenderTree`
   * при отрисовке, не здесь: объявление остаётся структурой, данные приходят отдельно.
   */
  readonly value: DynamicValue;
}

/**
 * Узел объявления: ВСПОМОГАТЕЛЬНЫЙ компонент кита — БЕЗ адреса анатомии.
 *
 * Часть-без-адреса — реальный случай, не редкий: скрытый `<input>` чекбокса/радиогруппы/файлов,
 * которым Ark никогда не пишет `data-part`, но без которого клик по превью не работает — реальный
 * `onChange` висит именно на нём. Ни «частью» (нет адреса анатомии — типом не наберётся), ни
 * «содержимым» (то всегда лист-текст, не живой компонент) такой узел не выразить, отсюда третий
 * вид.
 *
 * `extra` — имя из карты `KitComponent.extras` (`packages/ui/src/kit-form.ts`), не анатомии:
 * сверки с паспортом здесь нет и не будет — extras по определению вне анатомии.
 */
export interface PassportAssemblyExtra<Part extends string = string> {
  /** Имя в карте `extras` поставщика. */
  readonly extra: string;
  /** Пропы, без которых узел не заработает — та же роль, что и у `PassportAssemblyPart.props`. */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Пропы из данных — та же роль, что и у `PassportAssemblyPart.bind` (`PWEB-156`). */
  readonly bind?: Readonly<Record<string, string>>;
  /** Событие наружу — та же роль, что и у `PassportAssemblyPart.on` (`PWEB-157`). */
  readonly on?: Readonly<Record<string, DispatchAction>>;
  /** Части и содержимое внутри — та же однородная форма, что и у части. */
  readonly children?: readonly PassportAssemblyNode<Part>[];
}

/**
 * Узел объявления: ПОВТОР — один шаблон, размноженный по длине массива в данных (`PWEB-156`,
 * форма — A2UI, `ChildList`-шаблон: «размножь этот один узел по числу элементов по пути»).
 *
 * Число копий НЕ называется в дереве никем — ни автором сборки, ни тем, кто данные приносит.
 * Оно равно длине массива по `repeat.path`, и только ей: явное поле «сколько» рядом с путём было
 * бы вторым источником правды о том же факте, и они разошлись бы при первом же несовпадении длины
 * массива с названным числом (постановка user, 2026-08-27 — «точка входа одна»).
 */
export interface PassportAssemblyRepeat<Part extends string = string> {
  /**
   * Путь к массиву в данных. Абсолютный (с ведущим `/`) — относиться вне повтора нечему: этот
   * путь читается от корня данных, не от какого-либо элемента.
   */
  readonly repeat: DataBinding;
  /**
   * Узел-шаблон — часть, содержимое, extra либо вложенный повтор; размножается на каждый элемент
   * массива. Пути ВНУТРИ шаблона БЕЗ ведущего `/` читаются относительно ТЕКУЩЕГО элемента (тот же
   * приём, что у A2UI: `firstName` внутри шаблона по `/users` значит `/users/0/firstName`,
   * `/users/1/firstName`, ...).
   */
  readonly template: PassportAssemblyNode<Part>;
}

/** Повтор ли это — по наличию `repeat`, тем же приёмом, что различает extra (по наличию `extra`). */
export function isAssemblyRepeat<Part extends string = string>(
  node: PassportAssemblyNode<Part>,
): node is PassportAssemblyRepeat<Part> {
  return "repeat" in node;
}

/** Один узел объявления: часть, содержимое, вспомогательный компонент кита, либо повтор по данным. */
export type PassportAssemblyNode<Part extends string = string> =
  | PassportAssemblyPart<Part>
  | PassportAssemblyContent
  | PassportAssemblyExtra<Part>
  | PassportAssemblyRepeat<Part>;

/**
 * Одна сборка компонента — рабочий экземпляр, он же СХЕМА, по которой компонент собирается.
 *
 * Держатель сборки (`PassportEditorInfo.assemblies`) объявляет их СКОЛЬКО УГОДНО (`PWEB-115`):
 * условия («наведённый», «отключённый», «раскрытый», «пять разделов, все закрыты») перестали
 * укладываться в единственный экземпляр в тот день, когда компонент захотел показать больше
 * одного своего состояния сразу.
 *
 * ## Имя — не украшение, а адрес (`PWEB-126`)
 *
 * Список без имён читается по ПОЗИЦИИ (`assemblies[0]`), а позиция — не адрес: переставь записи
 * местами, и ссылавшийся на «первую» получит другую схему молча. Схема, которую выбрал скин
 * пользователя, обязана указываться на неё же после любой правки списка поставщиком — так же, как
 * наряд указывает на форму и палитру по имени, а не по месту в перечне службы.
 *
 * Схема — ОДНА СУЩНОСТЬ независимо от происхождения: та, что приехала с китом, и та, что сложил
 * пользователь сам (свой собственный флоу поверх той же сборки), адресуются и проверяются
 * одинаково — обе описывают ФОРМУ дерева, не то, чем оно наполнено.
 */
export interface PassportAssembly<Part extends string = string> {
  /**
   * Имя схемы — то, чем её выбирают из списка. Своя маленькая закрытая форма: короткая строка,
   * та же, что у ярлыка вида в службе пресетов (`kind`/`name`) — обеим нужен адрес, а не проза.
   */
  readonly name: string;
  /** Что это за экземпляр — человеку: «два раздела, оба свёрнуты». */
  readonly means: string;
  /** Дерево от корневой части. Корнем сборки бывает только корневая часть компонента. */
  readonly tree: PassportAssemblyPart<Part>;
  /**
   * Пропы невидимого провайдера, оборачивающего корень (`PWEB-153`) — у поповера/меню/диалога
   * настоящего DOM-узла на самом верху нет вообще: `<Popover>`/`<Menu>` ничего не рисуют, только
   * раздают состояние вниз через контекст Solid, а паспорт называет корнем ближайшую РЕАЛЬНУЮ
   * часть (`positioner`). Без обёртки та часть пытается прочитать контекст и падает.
   *
   * Поле отдельное от `tree.props`: те — пропы корневой ЧАСТИ, эти — пропы провайдера, разных
   * компонентов с разными пропами. Отсутствует у компонентов, чей корень — настоящий DOM-узел.
   */
  readonly providerProps?: Readonly<Record<string, unknown>>;
}

/**
 * Один заготовленный набор данных под сборку `filled` (`PWEB-156`) — «вариант заполнения».
 *
 * Поставляет ЕГО ТОТ ЖЕ, кто поставляет сборку: форма данных, которую сборка ждёт по своим
 * путям, — знание поставщика компонента, не витрины. Витрина показывает то, что объявлено, тем
 * же приёмом, что и у `assemblies`/`settings` — перечень читается, не придумывается заново на
 * стороне продукта.
 *
 * Не путать с адаптером, который позже подключит ЧУЖИЕ данные произвольной формы (пока не
 * начато, `PWEB-158`): пресет — это данные УЖЕ в форме, которую сборка ждёт, для того, чтобы
 * просто посмотреть, как компонент выглядит в разных ситуациях, без стороннего источника.
 */
export interface DataPreset {
  /** Имя — то, чем набор выбирают из перечня. Та же маленькая закрытая форма, что у имени сборки. */
  readonly name: string;
  /** Что это за ситуация — человеку: «пять длинных вопросов», «ни одного раздела». */
  readonly means: string;
  /** Сами данные — форма, которую ждут пути `bind`/`repeat` объявленной сборки `filled`. */
  readonly data: unknown;
}

/** Содержимое ли это — по наличию рода. Тот же дискриминант, что и в дереве механики. */
export function isAssemblyContent(
  node: PassportAssemblyNode,
): node is PassportAssemblyContent {
  return "genus" in node;
}

/** Вспомогательный компонент кита ли это — по наличию поля `extra`. */
export function isAssemblyExtra(
  node: PassportAssemblyNode,
): node is PassportAssemblyExtra {
  return "extra" in node;
}

/** Узел ЭЛЕМЕНТА плоского дерева — то, что рисуется компонентом из реестра. */
export interface BaseAssemblyElement {
  readonly id: string;
  /** Адрес части в реестре: `accordion.itemTrigger`, а у корня — сам адрес компонента. */
  readonly type: string;
  readonly parentId: string | null;
  readonly children: readonly string[];
  readonly props?: Readonly<Record<string, unknown>>;
  /** Пропы из данных (`PWEB-156`) — имя пропа → путь, уже абсолютный (прошёл через `scopeTemplate`, если узел вырос из повтора). */
  readonly bind?: Readonly<Record<string, string>>;
  /** Событие наружу (`PWEB-157`) — родное DOM-событие → что сказать вызывающему; пути внутри `context` уже абсолютные. */
  readonly on?: Readonly<Record<string, DispatchAction>>;
}

/** Узел СОДЕРЖИМОГО плоского дерева — лист, детей у него нет. */
export interface BaseAssemblyContent {
  readonly id: string;
  readonly genus: PassportGenus;
  /** Литерал ИЛИ ссылка на данные (`DynamicValue`, `PWEB-156`) — прошла через `baseAssemblyOf` без изменений. */
  readonly value: DynamicValue;
  readonly parentId: string | null;
  readonly children: readonly [];
}

/** Один узел плоского дерева. */
export type BaseAssemblyNode = BaseAssemblyElement | BaseAssemblyContent;

/**
 * Содержимое ли это — по наличию рода. Тот же дискриминант, что у объявления и у механики.
 *
 * @param node узел плоского дерева
 */
export function isContentNode(node: BaseAssemblyNode): node is BaseAssemblyContent {
  return "genus" in node;
}

/**
 * Плоская карта с корнем — форма, в которой дерево читает механика сборки.
 *
 * Обёртка `components` вокруг пары «корень и узлы» повторена намеренно: расхождение здесь
 * означало бы, что отдаваемое надо перекладывать, а перекладывание и есть та доработка
 * потребителем, от которой уходим.
 */
export interface BaseAssemblyTree {
  readonly components: {
    readonly root: string;
    readonly nodes: Readonly<Record<string, BaseAssemblyNode>>;
    /** Пропы невидимого провайдера, если сборка его называет (`PassportAssembly.providerProps`). */
    readonly providerProps?: Readonly<Record<string, unknown>>;
  };
}

/**
 * Собирает сборку компонента в плоское дерево, готовое к отрисовке.
 *
 * Сборка приходит ПАРАМЕТРОМ, а не снимается с паспорта (`PWEB-115`): паспорт (срез рантайма)
 * сборок больше не держит вовсе, а держатель — `PassportEditorInfo.assemblies`, и их там может
 * быть несколько. Какую из них рисовать — решает вызывающий (редактор), а не эта функция.
 *
 * Имена узлов детерминированы: имя части, при повторе — с числом (`item`, `item-2`). Значит
 * дерево одной и той же сборки собирается одинаково у всех, и записанный по этим именам
 * скин не разъедется от того, кто собирал.
 *
 * @param passport паспорт компонента — источник корня и имени по умолчанию
 * @param assembly сборка, которую разворачивают — один из `PassportEditorInfo.assemblies`
 * @param address адрес компонента в реестре; по умолчанию — его собственное имя
 * @param data данные для узлов-повторов (`PassportAssemblyRepeat`, `PWEB-156`) — число выросших
 *   копий читается из длины массива по объявленному пути, не из отдельного поля; без данных
 *   повтор разворачивается в ноль узлов (законное состояние, не отказ). Содержимого (`value`)
 *   это не касается — литерал/ссылка проезжают в плоское дерево как есть, резолвит их
 *   `RenderTree` при отрисовке, не эта функция.
 */
export function baseAssemblyOf(
  passport: ComponentPassport,
  assembly: PassportAssembly,
  address: string = passport.component,
  data?: unknown,
): BaseAssemblyTree {
  const nodes: Record<string, BaseAssemblyNode> = {};
  const taken = new Set<string>();

  /** Имя, которого в дереве ещё нет: имя части, а при повторе — с числом. */
  const nameFor = (base: string): string => {
    for (let ordinal = 1; ; ordinal += 1) {
      const name = ordinal === 1 ? base : `${base}-${ordinal}`;
      if (!taken.has(name)) {
        taken.add(name);
        return name;
      }
    }
  };

  // Корневая часть и компонент целиком — одно место дерева, и адрес у них один. Механика
  // приводит обе записи к этой; разойдись мы с ней здесь, узел корня не нашёлся бы в реестре.
  const addressOf = (part: string): string =>
    part === passport.root ? address : `${address}.${part}`;

  // Отдельный неймспейс для extras — тильда сразу после точки. Части с таким именем анатомия не
  // заведёт никогда (`~` не годится в имени части), коллизия исключена структурно, а не тем, что
  // никто пока не назвал часть так же, как extra.
  const addressOfExtra = (extra: string): string => `${address}.~${extra}`;

  // Абсолютный путь для пути БЕЗ ведущего "/" внутри шаблона повтора — тем же приёмом, что у
  // A2UI: относительный путь читается от ТЕКУЩЕГО элемента массива, а не от корня данных.
  const scopedPath = (base: string, path: string): string => (path.startsWith("/") ? path : `${base}/${path}`);

  /**
   * Копия узла-шаблона с относительными путями внутри, приведёнными к абсолютным для ОДНОГО
   * элемента массива (`base` — путь к этому элементу). Часть/extra/содержимое обходятся
   * рекурсивно; вложенный повтор получает свой путь тем же приёмом — он тоже может быть
   * относительным собственному элементу-владельцу.
   */
  const scopeTemplate = (node: PassportAssemblyNode, base: string): PassportAssemblyNode => {
    if (isAssemblyContent(node)) {
      return isDataBinding(node.value) ? { ...node, value: { path: scopedPath(base, node.value.path) } } : node;
    }

    if (isAssemblyRepeat(node)) {
      return { ...node, repeat: { path: scopedPath(base, node.repeat.path) } };
    }

    const boundBind = node.bind
      ? Object.fromEntries(Object.entries(node.bind).map(([name, path]) => [name, scopedPath(base, path)]))
      : undefined;
    const boundOn = node.on
      ? Object.fromEntries(
          Object.entries(node.on).map(([domEvent, action]) => [
            domEvent,
            {
              event: {
                name: action.event.name,
                ...(action.event.context
                  ? {
                      context: Object.fromEntries(
                        Object.entries(action.event.context).map(([key, value]) => [
                          key,
                          isDataBinding(value) ? { path: scopedPath(base, value.path) } : value,
                        ]),
                      ),
                    }
                  : {}),
              },
            },
          ]),
        )
      : undefined;
    const boundChildren = node.children?.map((child) => scopeTemplate(child, base));

    return {
      ...node,
      ...(boundBind ? { bind: boundBind } : {}),
      ...(boundOn ? { on: boundOn } : {}),
      ...(boundChildren ? { children: boundChildren } : {}),
    };
  };

  /**
   * Разворачивает узел объявления в узел дерева и спускается в детей.
   *
   * @param node узел объявления
   * @param parentId владелец
   * @returns имя положенного узла
   */
  const grow = (
    node: PassportAssemblyPart | PassportAssemblyContent | PassportAssemblyExtra,
    parentId: string | null,
  ): string => {
    if (isAssemblyContent(node)) {
      const id = nameFor(node.genus);

      nodes[id] = { id, genus: node.genus, value: node.value, parentId, children: [] };

      return id;
    }

    if (isAssemblyExtra(node)) {
      const id = nameFor(node.extra);
      const children: string[] = [];

      nodes[id] = {
        id,
        type: addressOfExtra(node.extra),
        parentId,
        children,
        ...(node.props ? { props: node.props } : {}),
        ...(node.bind ? { bind: node.bind } : {}),
        ...(node.on ? { on: node.on } : {}),
      };

      for (const child of node.children ?? []) children.push(...growAll(child, id));

      return id;
    }

    const id = nameFor(node.part === passport.root ? address : node.part);
    const children: string[] = [];

    // Узел кладётся ДО спуска: дети ссылаются на владельца по имени, и имя должно быть занято
    // раньше, чем его займёт повтор той же части глубже по дереву.
    nodes[id] = {
      id,
      type: addressOf(node.part),
      parentId,
      children,
      ...(node.props ? { props: node.props } : {}),
      ...(node.bind ? { bind: node.bind } : {}),
      ...(node.on ? { on: node.on } : {}),
    };

    for (const child of node.children ?? []) children.push(...growAll(child, id));

    return id;
  };

  /**
   * Один объявленный узел → ноль или больше выросших id: обычный узел даёт один, повтор —
   * по числу элементов массива под `repeat.path` (`PWEB-156`). Нет данных или путь ведёт не в
   * массив — ноль узлов, тем же приёмом, что и у остального содержимого без данных: показ
   * молчит, а не падает.
   */
  const growAll = (node: PassportAssemblyNode, parentId: string | null): string[] => {
    if (isAssemblyRepeat(node)) {
      const items = resolveDataBinding(data, node.repeat.path);
      if (!Array.isArray(items)) return [];

      // `flatMap`, не `map`: шаблон повтора вправе сам оказаться повтором (вложенный список),
      // и тогда один элемент внешнего массива даёт не один узел, а свои несколько.
      return items.flatMap((_, index) =>
        growAll(scopeTemplate(node.template, `${node.repeat.path}/${index}`), parentId),
      );
    }

    return [grow(node, parentId)];
  };

  const root = grow(assembly.tree, null);

  return {
    components: {
      root,
      nodes,
      ...(assembly.providerProps ? { providerProps: assembly.providerProps } : {}),
    },
  };
}
