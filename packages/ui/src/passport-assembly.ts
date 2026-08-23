// БАЗОВАЯ СБОРКА — как выглядит РАБОЧИЙ экземпляр компонента (`PWEB-89`).
//
// ## Что это чинит
//
// Чтобы показать гармошку, витрина сегодня выдумывает: сколько разделов, какие пропы дать киту,
// чтобы тот вообще заработал (`value` у раздела — без него Ark не знает, какой пункт раскрывать),
// чем наполнить части. Это знание о компоненте, и у витрины его быть не должно: следующий пульт
// напишет своё, поставщик выпустит четвёртую часть — и оба покажут её пустой, каждый по-своему.
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
// самую узкую запись того, что она с паспорта снимает, — вместо того чтобы зависеть на кит.
// Здесь то же самое, зеркально: узкая запись того, что мы отдаём, вместо зависимости на
// механику. Зависеть на неё кит и не может — направление зависимостей одностороннее.
//
// Совпадение двух записей держится не договорённостью, а пробой у ЧИТАТЕЛЯ: дерево, поданное в
// `RenderTree`, либо типизируется, либо нет. Пробы этой у нас нет и быть не может (кит не вправе
// тянуть механику даже в пробы — это замкнуло бы граф зависимостей), поэтому она названа в
// отчёте по задаче как долг читающей зоны.
//
// ## Адрес компонента — вход, а не константа
//
// В реестре компонент может лежать под чужим пространством имён (`ui.accordion`): адрес — дело
// того, кто реестр складывает. Поэтому адрес приходит параметром, а внутри дерева части
// адресуются от него; зашей мы `accordion.itemTrigger` в объявление — сборка сломалась бы у
// первого же потребителя, который положил кит не под голым именем.

import type { ComponentPassport, PassportGenus } from "./passport-form.js";

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
  /** Части и содержимое внутри — ОДНИМ списком, в том порядке, в каком их видно. */
  readonly children?: readonly PassportAssemblyNode<Part>[];
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
  /** Значение — то, что видно человеку. У рода `text` это подпись. */
  readonly value: string;
}

/** Один узел объявления: часть либо содержимое. */
export type PassportAssemblyNode<Part extends string = string> =
  | PassportAssemblyPart<Part>
  | PassportAssemblyContent;

/**
 * Базовая сборка компонента — минимальный рабочий экземпляр.
 *
 * Она ОДНА, и это решение: перечень сборок превратил бы паспорт в витрину, а витрина — не
 * предмет паспорта. Условия («наведённый», «отключённый», «раскрытый») ставятся осями поверх
 * этой сборки теми, кто их показывает; средства для этого у механики есть.
 */
export interface PassportAssembly<Part extends string = string> {
  /** Что это за экземпляр — человеку: «три раздела, первый раскрыт». */
  readonly means: string;
  /** Дерево от корневой части. Корнем сборки бывает только корневая часть компонента. */
  readonly tree: PassportAssemblyPart<Part>;
}

/** Содержимое ли это — по наличию рода. Тот же дискриминант, что и в дереве механики. */
export function isAssemblyContent(
  node: PassportAssemblyNode,
): node is PassportAssemblyContent {
  return "genus" in node;
}

/** Узел ЭЛЕМЕНТА плоского дерева — то, что рисуется компонентом из реестра. */
export interface BaseAssemblyElement {
  readonly id: string;
  /** Адрес части в реестре: `accordion.itemTrigger`, а у корня — сам адрес компонента. */
  readonly type: string;
  readonly parentId: string | null;
  readonly children: readonly string[];
  readonly props?: Readonly<Record<string, unknown>>;
}

/** Узел СОДЕРЖИМОГО плоского дерева — лист, детей у него нет. */
export interface BaseAssemblyContent {
  readonly id: string;
  readonly genus: PassportGenus;
  readonly value: string;
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
  };
}

/**
 * Собирает базовую сборку компонента в плоское дерево, готовое к отрисовке.
 *
 * Возвращает `undefined`, если базовой сборки компонент не объявил, — честно, а не пустым
 * деревом: пустое дерево выглядело бы как объявленный экземпляр, которого нет.
 *
 * Имена узлов детерминированы: имя части, при повторе — с числом (`item`, `item-2`). Значит
 * дерево одного и того же паспорта собирается одинаково у всех, и записанный по этим именам
 * скин не разъедется от того, кто собирал.
 *
 * @param passport паспорт компонента
 * @param address адрес компонента в реестре; по умолчанию — его собственное имя
 */
export function baseAssemblyOf(
  passport: ComponentPassport,
  address: string = passport.component,
): BaseAssemblyTree | undefined {
  const assembly = passport.assembly;

  if (!assembly) return undefined;

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

  /**
   * Разворачивает узел объявления в узел дерева и спускается в детей.
   *
   * @param node узел объявления
   * @param parentId владелец
   * @returns имя положенного узла
   */
  const grow = (node: PassportAssemblyNode, parentId: string | null): string => {
    if (isAssemblyContent(node)) {
      const id = nameFor(node.genus);

      nodes[id] = { id, genus: node.genus, value: node.value, parentId, children: [] };

      return id;
    }

    const id = nameFor(node.part === passport.root ? address : node.part);
    const children: string[] = [];

    // Узел кладётся ДО спуска: дети ссылаются на владельца по имени, и имя должно быть занято
    // раньше, чем его займёт повтор той же части глубже по дереву.
    nodes[id] = { id, type: addressOf(node.part), parentId, children, ...(node.props ? { props: node.props } : {}) };

    for (const child of node.children ?? []) children.push(grow(child, id));

    return id;
  };

  const root = grow(assembly.tree, null);

  return { components: { root, nodes } };
}
