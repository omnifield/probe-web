// ПРЕВЬЮ КОМПОНЕНТА — composeит слот витрины (`entities/showcase/ui/slot`) и рендерер
// (`entities/component/ui/renderer`): слот — место показа, рендерер — чем в нём рисуют. Ни один
// из двух друг про друга не знает, знает только этот виджет.
import type { DispatchedEvent } from "@web-core/assembly";

import { Renderer } from "#/entities/component/ui/renderer/renderer.jsx";
import { Slot } from "#/entities/showcase/ui/slot/slot.jsx";

export function ComponentPreview(props: {
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
  return (
    <Slot>
      <Renderer
        component={props.component}
        assembly={props.assembly}
        variant={props.variant}
        data={props.data}
        dispatch={props.dispatch}
      />
    </Slot>
  );
}
