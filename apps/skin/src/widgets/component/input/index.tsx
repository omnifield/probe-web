import { useAtom } from "@web-core/store";
import { createEffect } from "solid-js";

import { componentInfoAtom, generateFakeData } from "#/entities/component";

// ПЛЕЙСХОЛДЕР — форма виджета подготовлена заранее (слот `WorkspaceRightbar`), содержимое
// (панель ввода данных/пропов показываемого компонента) ещё не объявлено. Пока только тянет
// фейк-генератор (`entities/component/utils/fake-generator`) на инпут-схеме активного компонента
// — схема уже приезжает вместе с `componentInfoAtom`, второй раз её искать незачем.
export function Input() {
  const info = useAtom(componentInfoAtom);

  createEffect(() => {
    const state = info();
    if (state.status !== "done") return;
    console.log(generateFakeData(state.data?.io?.schema));
  });

  return <p>Инпут компонента (плейсхолдер)</p>;
}
