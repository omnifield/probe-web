// ПРЕВЬЮ КОМПОНЕНТА — отдельный виджет: рисует один экземпляр компонента (сборка + вариант)
// через настоящую механику (`instanceOf`/`RenderTree`), не как попало внутри страницы.
//
// БЕЗ НАПОЛНЕНИЯ ДАННЫМИ ПОКА: `entities/preview` (общий стор «чем наполнен показ») снят вместе
// со старой заготовкой-панелью — новая, на `zocker`, ещё не построена. Показ без данных —
// законное рабочее состояние (`RenderTree`'s `data` необязателен), не заглушка.
import { RenderTree } from "@omnifield/probe-web-assembly";

import { instanceOf } from "#/entities/component/model/instance.js";
import { REGISTRY } from "#/entities/component/model/registry.js";

export function ComponentPreview(props: {
  component: string;
  /** Имя сборки — не задано, берётся первая объявленная (см. `instanceOf`). */
  assembly?: string;
  /** Вариант скина (`data-variant`) — не задан, показывается без него. */
  variant?: string;
}) {
  const tree = () =>
    instanceOf(
      props.component,
      props.variant === undefined ? {} : { "data-variant": props.variant },
      props.assembly,
    );

  return <RenderTree tree={tree()} registry={REGISTRY} />;
}
