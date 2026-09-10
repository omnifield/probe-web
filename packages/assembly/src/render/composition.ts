// см. README.md / FAQ.md

import { createMemo } from "solid-js";

import { resolveComponent, type Registry } from "../engine/registry.js";
import { isContent, type AssemblyNode } from "../engine/tree.js";

/** Часть кита, которой рисуется узел по его собственному `type` — `undefined` у content-узла
 * (те не резолвятся, печатаются значением) и у адреса, которого нет в реестре. `registry` —
 * аксессор, не значение: читается ВНУТРИ тела мемо, тем же приёмом, каким весь этот файл читает
 * `node()` — реактивная зависимость обязана жить в трекнутом контексте, не быть аргументом,
 * захваченным на момент вызова фабрики. */
export function createResolvedComponent(registry: () => Registry, node: () => AssemblyNode | undefined) {
  const resolvedComponent = createMemo(() => {
    const current = node();
    if (!current || isContent(current)) return undefined;
    return resolveComponent(registry(), current.type);
  });
  return resolvedComponent;
}

/** Часть кита, которой рисуется узел ПО compose'у (`composedInto`) — кнопка бывает триггером
 * попапа/меню, адрес узла не меняется, составной компонент собирает саму композицию. */
export function createOuterComponent(registry: () => Registry, node: () => AssemblyNode | undefined) {
  const outerComponent = createMemo(() => {
    const current = node();
    const composed = current && !isContent(current) ? current.composedInto : undefined;
    if (composed === undefined) return undefined;
    return resolveComponent(registry(), composed);
  });
  return outerComponent;
}

export type Assembled =
  | { kind: "component"; Comp: unknown; composition?: { as: unknown } }
  | { kind: "missing"; type: string };

/** Решает, ЧЕМ рисовать узел — своей частью, чужим составным компонентом (`composedInto`) или
 * никем (адрес не разрешён). `outer` — аксессор, читается ТОЛЬКО когда `composedInto` реально
 * задан, чтобы не тянуть лишнюю подписку там, где composition не участвует. */
export function assembleComponent(
  current: AssemblyNode | undefined,
  Inner: unknown,
  outer: () => unknown,
): Assembled {
  if (!current || isContent(current)) return { kind: "missing", type: "" };
  if (!Inner) return { kind: "missing", type: current.type };

  const composed = current.composedInto;
  if (composed === undefined) return { kind: "component", Comp: Inner };

  const Outer = outer();
  if (!Outer) return { kind: "missing", type: composed };

  return { kind: "component", Comp: Outer, composition: { as: Inner } };
}
