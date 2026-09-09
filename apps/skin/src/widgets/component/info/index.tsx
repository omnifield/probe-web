import { createMemo } from "solid-js";

import { currentComponent, docsUrlOf } from "#/entities/component";
import { Docs } from "../docs";
import { Surface } from "@web-core/ui";

// ПЛЕЙСХОЛДЕР — форма виджета подготовлена заранее (верх `WorkspaceRightbar`, над `Input`),
// остальное содержимое (сведения о показываемом компоненте, кроме доков) ещё не объявлено.
export function Info() {
  const url = createMemo(() => {
    const component = currentComponent();
    return component === undefined ? undefined : docsUrlOf(component);
  });

  return <Docs url={url()} />;
}
