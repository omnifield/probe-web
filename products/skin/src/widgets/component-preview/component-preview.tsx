// ПРЕВЬЮ КОМПОНЕНТА — отдельный виджет (постановка user, 2026-08-29): рисует один экземпляр
// компонента (сборка + вариант) через настоящую механику (`instanceOf`/`RenderTree`), не как
// попало внутри страницы.
//
// `data` (PWEB-187/191) — чем наполнен показ: запись заготовки, выбранная в `DataInput`, читается
// через общий стор (`entities/preview`), не пропом отсюда — виджет превью не обязан знать про
// селектор заготовок, он просто рисует то, чем его наполнили.
//
// `dispatch` (постановка user, 2026-08-30) — то, что показанный компонент отдаёт наружу
// (клик и подобное), пишется В ТОТ ЖЕ стор (`previewStore.trigger.dispatched`), откуда его
// читает `DataOutput` — превью само по себе ничего не показывает, только слушает и передаёт.
import { RenderTree, type DispatchedEvent } from "@omnifield/probe-web-assembly";

import { instanceOf } from "#/entities/component/model/instance.js";
import { REGISTRY } from "#/entities/component/model/registry.js";
import { previewStore, usePreviewFill } from "#/entities/preview/model/store.js";

export function ComponentPreview(props: {
  component: string;
  /** Имя сборки — не задано, берётся первая объявленная (см. `instanceOf`). */
  assembly?: string;
  /** Вариант скина (`data-variant`) — не задан, показывается без него. */
  variant?: string;
}) {
  const fill = usePreviewFill();
  const data = () => fill() ?? {};

  const tree = () =>
    instanceOf(
      props.component,
      props.variant === undefined ? {} : { "data-variant": props.variant },
      props.assembly,
      data(),
    );

  const onDispatch = (event: DispatchedEvent) => previewStore.trigger.dispatched({ event });

  return <RenderTree tree={tree()} registry={REGISTRY} data={data()} dispatch={onDispatch} />;
}
