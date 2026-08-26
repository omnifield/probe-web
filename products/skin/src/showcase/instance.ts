// ЭКЗЕМПЛЯР СЛУЧАЯ — компонент, поставленный в координату (`PWEB-31`).
//
// ЭКЗЕМПЛЯР БЕРЁТСЯ У ПОСТАВЩИКА. Прежде витрина держала три своих перечня — сколько раз повторить
// часть, какие пропы дать киту, чтобы тот заработал, и чем наполнить части, — и всё это было
// знанием о компоненте, которого у показа быть не должно.
//
// Теперь базовые сборки объявляет тот, кто компонент написал (`assemblies` в срезе редактора,
// `PWEB-115`/`PWEB-116`), а показ поднимает ПЕРВУЮ — своего выбора между несколькими у него нет,
// это работа редактора, не показа. Нет ни одной объявленной сборки — берётся образец из анатомии:
// одна часть, ни повторов, ни наполнения. Кнопке этого хватает, составному компоненту нет, и его
// поставщик обязан сборку объявить.

import { isContent, sketchOf, updateNode, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { FORCE_ATTRIBUTE } from "@omnifield/probe-web-skin/model";
import {
  baseAssemblyOf,
  editorInfoOf,
  passportOf,
  type PassportMark,
} from "@omnifield/probe-web-ui/passport";

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
  partAddress?: string,
  stateMark?: PassportMark,
): AssemblyTree {
  const passport = passportOf(component);
  const assembly = editorInfoOf(component)?.assemblies[0];
  const base = passport && assembly ? baseAssemblyOf(passport, assembly) : undefined;
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

  if (stateMark === undefined || partAddress === undefined) return filled;

  const target = nodeOfPart(filled, partAddress);

  // Части нет в образце — состояние не ставим и молчим: это законно, часть могла не попасть в
  // образец. Отказывать здесь значило бы ронять показ из-за выбора оси.
  if (target === undefined) return filled;

  const props = target === root ? { ...rootProps, ...stateProps(stateMark) } : stateProps(stateMark);
  const onPart = updateNode(filled, target, { props });

  if (!onPart.ok) throw new Error(`витрина: состояние не легло на часть — ${onPart.means}`);

  return onPart.tree;
}
