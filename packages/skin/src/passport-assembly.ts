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
    }
  | {
      /** Ссылка на ЛЮБОЙ компонент общего реестра (declared as a `PassportAssemblyElement` whose
       *  `node` names something outside this component's own anatomy, `PWEB-166`/`PWEB-172`). Без
       *  имени — часть не обязана знать, КАКОЙ именно компонент туда положат, только что это
       *  законное место для настоящего чужого компонента. */
      readonly kind: "component";
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
    if (candidate.kind === "component") return allowed.kind === "component";
    return allowed.kind === "content" && FITS[candidate.genus].includes(allowed.genus);
  });
}

/**
 * Declaration node: a piece of the tree, own part OR a reference to another component of the
 * shared registry — ONE field for both (`PWEB-172`, page 112 §1). `PassportAssemblyPart` and
 * `PassportAssemblyComponent` used to be two separate types (`PWEB-166`) for the same relationship
 * seen from two sides: "put a component here" is the same instruction whether that component is
 * one of this component's own anatomy parts or a completely independent one from the registry.
 * Splitting them was a real cost even at the time (two admission kinds, two node shapes to check
 * everywhere a tree is walked) paid for exactly one thing: a typo in a foreign name (`component`)
 * was already only caught live, so a typo in an OWN part name being caught by `tsc` (`part: Part`)
 * was the one asymmetry worth keeping two fields for — found not worth it once the reference
 * mechanism (`PWEB-167`–`171`) actually got exercised: same source, `egor6-66/capsuleTech`, one
 * field (`type: string`) for a kit primitive and a whole business page alike.
 *
 * `node`'s value is looked up against the OWNING component's own anatomy (`baseAssemblyOf`,
 * `checkAssembly`) to tell the two apart: matches a real part name → it is one; anything else is
 * assumed a reference to that name in the general registry. A typo in an own part name is
 * therefore no longer caught AT ALL before render (not by `tsc`, since the field is no longer a
 * literal union of just this component's parts; not by `checkAssembly` either, since it has no
 * way to tell "meant to be my part, typo'd" from "a real foreign component named that" — it never
 * could, for the `component` side, and now the same is true for what used to be `part`). This is
 * the accepted price of one field (`PWEB-172`'s own ticket named it going in), not an oversight.
 *
 * Имени у узла нет: имена ставит `baseAssemblyOf`, и ставит так же, как их ставит образец
 * механики — именем части, а при повторе с числом. Совпадение здесь не украшение: человек,
 * увидевший `item-2` в одном месте и `item-2` в другом, вправе считать, что это одно и то же.
 */
export interface PassportAssemblyElement<Part extends string = string> {
  /**
   * Own anatomy part name OR a bare top-level name in the shared registry — same field, resolved
   * by comparing against the owner's own anatomy, not by which one the author meant to write.
   *
   * Typed `Part | string`, not bare `string`: written this way (not collapsed by hand to
   * `string`, even though `Part` is a subtype and the compiler will accept ANY string here
   * either way) purely for editor autocomplete — this component's real part names still show up
   * as suggestions, foreign names are simply not rejected. No compile-time protection either way.
   */
  readonly node: Part | string;
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
  /**
   * Repeat THIS node itself by the length of the array at `repeat.path` (`PWEB-171`) — a field
   * next to `node`/`bind`/`props`, not a separate wrapper node (`PassportAssemblyRepeat`, kept
   * for now as the older, still-working form — see its own doc comment). The node's own
   * `bind`/`props`/`on`/`children` are the per-instance template; nothing about the node's shape
   * changes when `repeat` is set, only that it grows once per array element instead of once.
   */
  readonly repeat?: DataBinding;
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
  /** Пропы, без которых узел не заработает — та же роль, что и у `PassportAssemblyElement.props`. */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Пропы из данных — та же роль, что и у `PassportAssemblyElement.bind` (`PWEB-156`). */
  readonly bind?: Readonly<Record<string, string>>;
  /** Событие наружу — та же роль, что и у `PassportAssemblyElement.on` (`PWEB-157`). */
  readonly on?: Readonly<Record<string, DispatchAction>>;
  /** Части и содержимое внутри — та же однородная форма, что и у части. */
  readonly children?: readonly PassportAssemblyNode<Part>[];
}

/**
 * Component's OWN behavior — runtime slice (`PWEB-167`, page 112 §4, "Accepted — Option B,
 * refined").
 *
 * NOT a showcase scenario: no `name`, no `means` — a scenario is one of several, this is the one
 * and only real behavior. A reference to this component from someone else's assembly (a `node`
 * pointing at it, `PWEB-172`) feeds THIS tree data (`props`/`bind` on the reference node), it
 * does not override its `on`/`children` — the component stays the author of its own behavior
 * (page 111 §5, user verbatim: "the button doesn't know who passes what in the payload").
 *
 * Lives in the RUNTIME slice (this file is re-exported through `./model`, not only `./editor`) —
 * unlike `PassportAssembly` (carries `means` and showcase scenarios, stays editor-only): the
 * reference unfolds on the real product render, not in the editor.
 */
export interface PassportSelfAssembly<Part extends string = string> {
  /** Tree from the root part — same shape as `PassportAssembly.tree`. */
  readonly tree: PassportAssemblyElement<Part>;
}

/**
 * Узел объявления: ПОВТОР (older, wrapper form — `PWEB-156`). Superseded by `repeat` as a field
 * on the node itself (`PassportAssemblyElement.repeat`, `PWEB-171`): user's sketch put `repeat`
 * next to `node`/`bind` on ONE node, not wrapped around it. Kept working, not removed, until
 * every consumer has moved off it (grepped for at the time of `PWEB-171` — accordion's live
 * assemblies still use this wrapper) — a form nothing depends on gets deleted, not deprecated in
 * place.
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

/**
 * Wrapper-form repeat, specifically — by the presence of `template` (`PWEB-171`), not `repeat`:
 * `repeat` alone no longer picks out one node shape, now that `PassportAssemblyElement` can carry
 * it too as a field. `template` stays unique to the wrapper.
 */
export function isAssemblyRepeat<Part extends string = string>(
  node: PassportAssemblyNode<Part>,
): node is PassportAssemblyRepeat<Part> {
  return "template" in node;
}

/**
 * Узел объявления: ССЫЛКА на именованный кусок дерева, объявленный один раз (`PassportAssembly.refs`,
 * `PWEB-160`).
 *
 * Найдено ресёрчем рынка (2026-08-27, постановка user — «сборки дублируются, таскать целиком
 * дорого»): у A2UI компоненты лежат плоской картой по id, а «ребёнок» — просто СВОЙСТВО,
 * ссылающееся на чужой id, — ничто не мешает одному id быть ребёнком у двух родителей сразу. Тот
 * же приём — GraphQL-нормализация (сущность хранится раз, остальные держат ссылку) и
 * мастер-компонент/инстанс у Figma (переопределения поверх, не копия).
 *
 * У нас `RenderTree` обходит настоящее дерево (`parentId` — одно поле, не список), и это ПРАВИЛЬНО
 * для отрисовки, — поэтому граф не заводим. Вместо этого ссылка на разворачивании (`baseAssemblyOf`)
 * превращается в СВОИ настоящие узлы на КАЖДОЙ площадке, где стоит `{ ref }`, — тем же приёмом,
 * что уже разворачивает `template` у повтора (`PassportAssemblyRepeat`), просто без массива. В
 * объявлении и по сети — маленькая ссылка, не вся структура целиком.
 */
export interface PassportAssemblyRef {
  /** Имя в `assembly.refs` — не найдено, сборка отвергается: дефект объявления, не данных. */
  readonly ref: string;
  /**
   * Пропы поверх найденного шаблона — сайт ссылки побеждает при совпадении имени с тем, что
   * шаблон объявил сам (тот же приём, что переопределение инстанса поверх мастер-компонента).
   */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Пропы из данных поверх шаблона — та же роль и то же побеждающее слияние, что у `props`. */
  readonly bind?: Readonly<Record<string, string>>;
  /** Событие наружу поверх шаблона — та же роль и то же побеждающее слияние. */
  readonly on?: Readonly<Record<string, DispatchAction>>;
}

/** Ссылка ли это — по наличию `ref`, тем же приёмом, что различает extra/повтор. */
export function isAssemblyRef<Part extends string = string>(
  node: PassportAssemblyNode<Part>,
): node is PassportAssemblyRef {
  return "ref" in node;
}

/** Один узел объявления: часть/ссылка на компонент реестра (`PassportAssemblyElement`, `PWEB-172`),
 *  содержимое, вспомогательный компонент кита, повтор по данным (обёрткой), либо ссылка на
 *  именованный кусок. */
export type PassportAssemblyNode<Part extends string = string> =
  | PassportAssemblyElement<Part>
  | PassportAssemblyContent
  | PassportAssemblyExtra<Part>
  | PassportAssemblyRepeat<Part>
  | PassportAssemblyRef;

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
  readonly tree: PassportAssemblyElement<Part>;
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
  /**
   * Именованные куски дерева, объявленные ОДИН раз и используемые СКОЛЬКО угодно раз через
   * `{ ref: "имя" }` где угодно внутри `tree` (`PWEB-160`) — большая или повторяющаяся сборка не
   * обязана дублировать одну и ту же структуру в объявлении на каждой площадке, где она нужна.
   *
   * Область — ЭТА сборка, не глобальный реестр: перекрёстные ссылки между разными сборками или
   * разными компонентами не заведены — понадобятся, будут решением, а не тихим расширением.
   */
  readonly refs?: Readonly<Record<string, PassportAssemblyNode<Part>>>;
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

  // Own anatomy part names — the ONLY thing that tells an own `node` from a bare reference to
  // another component of the shared registry, now that both write the same field (`PWEB-172`).
  const declared = passport.anatomy.keys();

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
  //
  // Empty string is a SPECIAL case, not an ordinary relative segment (`PWEB-170`): by RFC 6901 an
  // empty path already means "the whole data" (`resolveDataBinding`, `path === ""`) — here that
  // same meaning applies to the CURRENT repeat element: "the whole current node, not a field on
  // it". Without this branch, an empty string would glue into `${base}/` — a path with a
  // trailing slash that `resolveDataBinding` parses as one with an empty last segment and
  // resolves nowhere. No second marker (a `.`) is introduced: the meaning already existed, it
  // just needed to survive repeat scoping.
  const scopedPath = (base: string, path: string): string =>
    path === "" ? base : path.startsWith("/") ? path : `${base}/${path}`;

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

    // Field-form repeat (`PWEB-171`): same deferral as the wrapper just above — only the node's
    // own `repeat.path` is rebased here. Its `bind`/`on`/`children` are the per-instance template
    // and get scoped on the NEXT pass, once `growAll` knows which array index they belong to.
    // Falling through to the generic branch below would scope them against THIS base instead —
    // one level too shallow, the same bug the wrapper's own deferral exists to avoid.
    if ("repeat" in node && node.repeat) {
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
    // Ссылка (`PassportAssemblyRef`) детей не несёт — своё содержимое у неё берётся из найденного
    // по имени шаблона, ПОСЛЕ разрешения, а не здесь.
    const boundChildren = "children" in node ? node.children?.map((child) => scopeTemplate(child, base)) : undefined;

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
    node: PassportAssemblyElement | PassportAssemblyContent | PassportAssemblyExtra,
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

    // Own part vs. a bare reference to another component of the shared registry — same field
    // (`node.node`, `PWEB-172`), told apart ONLY by whether the name matches this component's
    // own anatomy. A foreign name gets NO owner prefix (unlike extra/own-part addressing) — it is
    // the same bare address `readAddress` already resolves at the top level of any component
    // (`packages/assembly/src/registry.ts`, untouched by this — it never cared how the address
    // was written, only what it resolves to).
    const isOwnPart = declared.includes(node.node);
    const id = nameFor(isOwnPart && node.node === passport.root ? address : node.node);
    const children: string[] = [];

    // Узел кладётся ДО спуска: дети ссылаются на владельца по имени, и имя должно быть занято
    // раньше, чем его займёт повтор той же части глубже по дереву.
    nodes[id] = {
      id,
      type: isOwnPart ? addressOf(node.node) : node.node,
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
  /**
   * Сайт ссылки поверх найденного по имени шаблона (`PWEB-160`) — сайт ПОБЕЖДАЕТ при совпадении
   * имени, тем же приёмом, что переопределение инстанса поверх мастер-компонента у Figma.
   * Содержимое и повтор своих `props`/`bind`/`on` не несут — слияние им ничего не добавляет, и
   * ветка на них не заходит, поэтому объединять там нечего.
   */
  const mergeRef = (
    template: PassportAssemblyNode,
    ref: PassportAssemblyRef,
  ): PassportAssemblyNode => {
    if (isAssemblyContent(template) || isAssemblyRepeat(template)) return template;

    const props = ref.props || template.props ? { ...template.props, ...ref.props } : undefined;
    const bind = ref.bind || template.bind ? { ...template.bind, ...ref.bind } : undefined;
    const on = ref.on || template.on ? { ...template.on, ...ref.on } : undefined;

    return {
      ...template,
      ...(props ? { props } : {}),
      ...(bind ? { bind } : {}),
      ...(on ? { on } : {}),
    };
  };

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

    // Field-form repeat (`PWEB-171`): the node repeats ITSELF — same expansion as the wrapper
    // above, just with the node (minus `repeat`) standing in for `template`, since there is no
    // separate template node to reach for.
    if ("repeat" in node && node.repeat) {
      const { repeat, ...template } = node;
      const items = resolveDataBinding(data, repeat.path);
      if (!Array.isArray(items)) return [];

      return items.flatMap((_, index) =>
        growAll(scopeTemplate(template as PassportAssemblyNode, `${repeat.path}/${index}`), parentId),
      );
    }

    if (isAssemblyRef(node)) {
      const template = assembly.refs?.[node.ref];
      if (!template) {
        throw new Error(
          `сборка «${assembly.name}» ссылается на «${node.ref}», которого нет в её refs — дефект объявления`,
        );
      }

      // Рекурсия, не `grow` напрямую: найденный шаблон вправе сам оказаться повтором либо
      // вложенной ссылкой, второй логики под это заводить не нужно.
      return growAll(mergeRef(template, node), parentId);
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
