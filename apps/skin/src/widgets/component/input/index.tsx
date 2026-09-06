import { useAtom } from "@web-core/store";
import { Button } from "@web-core/ui";
import { createEffect } from "solid-js";

import {
  componentDataAtom,
  componentInfoAtom,
  generateFakeData,
} from "#/entities/component";

// ПЛЕЙСХОЛДЕР — форма виджета подготовлена заранее (слот `WorkspaceRightbar`), содержимое
// (панель ввода данных/пропов показываемого компонента) ещё не объявлено. Пока только генерирует
// фейковые данные по инпут-схеме активного компонента (`entities/component/utils/fake-generator`)
// в `componentDataAtom` — сама на смену компонента, и по кнопке вручную тем же путём.
export function Input() {
  const info = useAtom(componentInfoAtom);

  function generate() {
    const state = info();

    if (state.status !== "done" || state.data === undefined) return;
    componentDataAtom.set(
      generateFakeData(state.data.io?.schema, state.data.component),
    );
  }

  createEffect(() => generate());

  return (
    <p>
      <Button onClick={generate}>generate fake</Button>
    </p>
  );
}
