// РЕНДЕРЕР — рисует один экземпляр компонента кита (сборка + вариант) через настоящую механику
// (`instanceOf`/`RenderTree`), не как попало внутри страницы.
//
// `data`/`dispatch` — ПРОПЫ, ПЕРЕДАЮТСЯ СВЕРХУ, своих не заводит и не хранит: чем наполнен показ
// и куда уходят события показанного компонента — решает вызывающий, рендерер только исполняет.
// `data` идёт и в `instanceOf` (повтор/бинды при сборке дерева), и в саму `RenderTree` (узлы
// `{path}` при отрисовке) — то же значение, два разных момента, где оно нужно.
import { RenderTree, type DispatchedEvent } from "@omnifield/probe-web-assembly";

import { instanceOf } from "../../model/instance.js";
import { REGISTRY } from "../../model/registry.js";

export function Renderer(props: {
  component: string;
  /** Имя сборки — не задано, берётся первая объявленная (см. `instanceOf`). */
  assembly?: string;
  /** Вариант скина (`data-variant`) — не задан, показывается без него. */
  variant?: string;
  /** Данные для узлов-биндингов и повтора. Не заданы — показ без данных, законное состояние. */
  data?: unknown;
  /** Куда уходят события показанного компонента (клик и подобное). Не задан — некому сказать. */
  dispatch?: (event: DispatchedEvent) => void;
}) {
  const tree = () =>
    instanceOf(
      props.component,
      props.variant === undefined ? {} : { "data-variant": props.variant },
      props.assembly,
      props.data,
    );

  return (
    <RenderTree
      tree={tree()}
      registry={REGISTRY}
      data={props.data}
      dispatch={props.dispatch}
    />
  );
}
