import { isContent, sketchOf, updateNode, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { baseAssemblyOf, editorInfoOf, passportOf } from "@omnifield/probe-web-ui/passport";

import { REGISTRY } from "./registry.js";

export function instanceOf(
  component: string,
  rootProps: Readonly<Record<string, unknown>>,
  assemblyName?: string,
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

  const onRoot = updateNode(sketch as AssemblyTree, root, {
    props: { ...(!before || isContent(before) ? {} : before.props), ...rootProps },
  });

  if (!onRoot.ok) throw new Error(`витрина: экземпляр отвергнут механикой — ${onRoot.means}`);

  return onRoot.tree;
}
