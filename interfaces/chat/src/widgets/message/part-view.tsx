import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";

import type { Part } from "../../entities/conversation/model";
import { rendererOf } from "../../entities/conversation/part-registry";
import { registerTextPart } from "./text-part";

// Вызов на уровне модуля, не лениво внутри компонента: `PartView` — единственный экспорт этого
// файла, который реально используют, поэтому весь модуль (и эта строка вместе с ним) остаётся в
// сборке при "sideEffects": false пакета. Bare side-effect import из ОТДЕЛЬНОГО файла (первая
// попытка) esbuild выкидывал целиком именно из-за этого флага — см. ROADMAP, лог.
registerTextPart();

export function PartView(props: { readonly part: Part }) {
  return (
    <Show when={rendererOf(props.part.type)}>
      {(Renderer) => <Dynamic component={Renderer()} part={props.part} />}
    </Show>
  );
}
