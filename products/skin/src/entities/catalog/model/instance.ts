// ЭКЗЕМПЛЯР СЛУЧАЯ — компонент, поставленный в координату (`PWEB-31`).
//
// ЭКЗЕМПЛЯР БЕРЁТСЯ У ПОСТАВЩИКА. Прежде витрина держала три своих перечня — сколько раз повторить
// часть, какие пропы дать киту, чтобы тот заработал, и чем наполнить части, — и всё это было
// знанием о компоненте, которого у показа быть не должно.
//
// Теперь базовые сборки объявляет тот, кто компонент написал (`assemblies` в срезе редактора,
// `PWEB-115`/`PWEB-116`). Нет ни одной объявленной сборки — берётся образец из анатомии: одна
// часть, ни повторов, ни наполнения. Кнопке этого хватает, составному компоненту нет, и его
// поставщик обязан сборку объявить.
//
// СБОРОК СТАЛО МНОГО У ОДНОГО КОМПОНЕНТА (сетка: `basic`/`gallery`/`workspace` — разные
// композиции, не разный вид одной), и молчаливый выбор ПЕРВОЙ прятал бы остальные от смотрящего
// навсегда — записал бы их, а увидеть было бы неоткуда. Поэтому имя сборки — довод: не назвали —
// первая, тем же приёмом, что и раньше; назвали — берётся она, если такая объявлена.

import { isContent, sketchOf, updateNode, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { FORCE_ATTRIBUTE } from "@omnifield/probe-web-skin/model";
import { baseAssemblyOf, type PassportMark } from "@omnifield/probe-web-ui/passport";

import { editorInfoOf, passportOf } from "./providers.js";
import { REGISTRY } from "./registry.js";

/**
 * Как выставить состояние В РАЗМЕТКЕ — по тому, чем его объявил паспорт.
 *
 * Атрибутные состояния ставятся атрибутом, псевдоклассовые — признаком принуждения. Это показ
 * ВИДА, а не проверка поведения: что кит действительно ставит `data-disabled` от своего пропа,
 * проверяют его собственные пробы, и повторять их здесь нечем и незачем.
 *
 * Знание о том, каким пропом включается состояние, паспорту не принадлежит: он объявляет
 * наблюдаемую поверхность для вида, а не сигнатуру вызова. Поэтому витрина идёт от разметки —
 * ровно оттуда же, откуда идёт скин.
 */
export function stateProps(mark: PassportMark): Record<string, unknown> {
  return mark.kind === "pseudo"
    ? { [FORCE_ATTRIBUTE]: mark.name.replace(/^:/, "") }
    : { [mark.name]: mark.value ?? "" };
}

/**
 * ВСЕ узлы образца по адресу части — их бывает несколько: пунктов много, адрес один.
 *
 * Узлы СОДЕРЖИМОГО пропускаются: адреса у них нет вовсе — они опознаются родом, — и состояние на
 * подпись не ставится, потому что подпись не часть.
 */
function nodesOfPart(tree: AssemblyTree, address: string): string[] {
  return Object.values(tree.components.nodes)
    .filter((node) => !isContent(node) && node.type === address)
    .map((node) => node.id);
}

/** Первый узел части, либо `undefined` — если такой части в образце нет. */
function nodeOfPart(tree: AssemblyTree, address: string): string | undefined {
  return nodesOfPart(tree, address)[0];
}

/**
 * Собирает случай: экземпляр компонента плюс условие.
 *
 * Отказ механики — **исключение**, а не значение, и это единственное такое место в зоне: отказ
 * означает, что случай написан против паспорта, то есть дефект нашей записи, а не состояние
 * данных. Молча показать вместо него пустое место значило бы спрятать его от себя же.
 */
export function instanceOf(
  component: string,
  rootProps: Readonly<Record<string, unknown>>,
  partAddresses?: readonly string[],
  stateMark?: PassportMark,
  assemblyName?: string,
  /**
   * Данные для узлов-биндингов и повтора (`PWEB-156`). Не своя, отдельная забота показа —
   * ЛЮБАЯ сборка вправе на них ссылаться, и случай не обязан знать заранее, ссылается ли. Не
   * задано — узлы с `{path}` резолвятся в пусто, повтор — в ноль узлов, тем же приёмом, что и
   * при показе без данных где угодно ещё.
   */
  data?: unknown,
): AssemblyTree {
  const passport = passportOf(component);
  const assemblies = editorInfoOf(component)?.assemblies ?? [];
  const assembly =
    (assemblyName !== undefined ? assemblies.find((item) => item.name === assemblyName) : undefined) ??
    assemblies[0];
  const base = passport && assembly ? baseAssemblyOf(passport, assembly, undefined, data) : undefined;
  const sketch = base ?? sketchOf(REGISTRY, component);

  if (!sketch) {
    throw new Error(`витрина: компонента «${component}» нет в реестре — случай собрать не из чего`);
  }

  const root = sketch.components.root;
  const before = (sketch as AssemblyTree).components.nodes[root];

  // ПРОПЫ СЛИВАЮТСЯ, А НЕ ЗАМЕЩАЮТСЯ: в объявленной сборке на корне уже стоит то, без чего кит
  // не работает (у гармошки — какой раздел раскрыт). Положи мы поверх одну вариацию, экземпляр
  // поставщика развалился бы, а выглядело бы это как «скин сломал компонент».
  const onRoot = updateNode(sketch as AssemblyTree, root, {
    props: { ...(!before || isContent(before) ? {} : before.props), ...rootProps },
  });

  if (!onRoot.ok) throw new Error(`витрина: случай отвергнут механикой — ${onRoot.means}`);

  const filled: AssemblyTree = onRoot.tree;

  if (stateMark === undefined || partAddresses === undefined || partAddresses.length === 0) {
    return filled;
  }

  // СТАВИМ НА КАЖДЫЙ УЗЕЛ, КОТОРЫЙ КИТ РЕАЛЬНО ЗЕРКАЛИТ (`partsWithMark`, `shape.ts`): чекбокс
  // кладёт один и тот же признак на `root`/`control`/`indicator`/`label` разом, и показ с одним
  // отмеченным узлом соврал бы о разметке — рецепт, красящий любую из остальных частей, остался
  // бы невидим не потому, что неверен, а потому что признака на её узле в этом кадре не было.
  let tree = filled;

  for (const partAddress of partAddresses) {
    const target = nodeOfPart(tree, partAddress);

    // Части нет в образце — состояние не ставим и молчим: это законно, часть могла не попасть в
    // образец. Отказывать здесь значило бы ронять показ из-за выбора оси.
    if (target === undefined) continue;

    const props = target === root ? { ...rootProps, ...stateProps(stateMark) } : stateProps(stateMark);
    const onPart = updateNode(tree, target, { props });

    if (!onPart.ok) throw new Error(`витрина: состояние не легло на часть — ${onPart.means}`);

    tree = onPart.tree;
  }

  return tree;
}
