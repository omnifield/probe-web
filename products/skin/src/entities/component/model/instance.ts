// ЭКЗЕМПЛЯР КОМПОНЕНТА — компонент, поставленный в узел показа.
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
//
// ПОКАЗ СОСТОЯНИЙ ЧАСТИ (`:hover`/`:disabled` и подобное, механизм `PWEB-31` старой витрины
// «случаев») СНЯТ (2026-08-30, находка user: «удаляй всё старое что ненужно») — параметры
// `partAddresses`/`stateMark` не передавал ни один живой вызов, ветка была недостижима с тех пор,
// как та витрина ушла. `stateProps`/`nodeOfPart` были только для неё, снесены вместе.

import { isContent, sketchOf, updateNode, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { baseAssemblyOf } from "@omnifield/probe-web-ui/passport";

import { editorInfoOf, passportOf } from "./providers.js";
import { REGISTRY } from "./registry.js";

/**
 * Собирает экземпляр: компонент, поставленный в показ, по имени и данным.
 *
 * Отказ механики — **исключение**, а не значение, и это единственное такое место в зоне: отказ
 * означает, что показ написан против паспорта, то есть дефект нашей записи, а не состояние
 * данных. Молча показать вместо него пустое место значило бы спрятать его от себя же.
 */
export function instanceOf(
  component: string,
  rootProps: Readonly<Record<string, unknown>>,
  assemblyName?: string,
  /**
   * Данные для узлов-биндингов и повтора (`PWEB-156`). Не своя, отдельная забота показа —
   * ЛЮБАЯ сборка вправе на них ссылаться, и показ не обязан знать заранее, ссылается ли. Не
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
    throw new Error(`витрина: компонента «${component}» нет в реестре — экземпляр собрать не из чего`);
  }

  const root = sketch.components.root;
  const before = (sketch as AssemblyTree).components.nodes[root];

  // ПРОПЫ СЛИВАЮТСЯ, А НЕ ЗАМЕЩАЮТСЯ: в объявленной сборке на корне уже стоит то, без чего кит
  // не работает (у гармошки — какой раздел раскрыт). Положи мы поверх одну вариацию, экземпляр
  // поставщика развалился бы, а выглядело бы это как «скин сломал компонент».
  const onRoot = updateNode(sketch as AssemblyTree, root, {
    props: { ...(!before || isContent(before) ? {} : before.props), ...rootProps },
  });

  if (!onRoot.ok) throw new Error(`витрина: экземпляр отвергнут механикой — ${onRoot.means}`);

  return onRoot.tree;
}
