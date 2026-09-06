import type { ComponentInfo } from "@web-core/ui/component-info";
import { useAtom } from "@web-core/store";
import { createEffect, createMemo, on } from "solid-js";

import { generateFakeData } from "../utils/fake-generator";
import { componentDataAtom, componentInfoAtom, currentComponent } from "./store";

export interface ComponentHandle {
  /** Готовы ли данные компонента (инфо и io-схема пришли) — раньше генерировать/показывать нечего. */
  readonly ready: () => boolean;
  /** Сгенерировать заново фейковые данные ТЕКУЩЕГО компонента, записать в `componentDataAtom`. */
  readonly generate: () => void;
  /** Паспорт/срез редактора/io ТЕКУЩЕГО компонента — не готово или компонент не выбран → `undefined`. */
  readonly info: () => ComponentInfo | undefined;
}

/**
 * Единая точка входа для всего, что знает о состоянии ТЕКУЩЕГО компонента — не абстрактный
 * генератор, а генератор ИМЕННО этого компонента: сам решает, готов ли, сам сбрасывает данные
 * ПРЕДЫДУЩЕГО компонента при смене (без этого витрина на миг показывает чужой, обычно более
 * длинный текст — гонка между сбросом `currentComponent` и приездом нового `componentInfoAtom`).
 * Новый метод — одна правка здесь, не поиск по виджетам, которые лезли в атомы напрямую.
 */
export function componentHandle(): ComponentHandle {
  const info = useAtom(componentInfoAtom);

  createEffect(on(currentComponent, () => componentDataAtom.set(undefined)));

  const ready = createMemo(() => {
    const state = info();
    return state.status === "done" && state.data !== undefined;
  });

  function generate(): void {
    const state = info();
    if (state.status !== "done" || state.data === undefined) return;
    componentDataAtom.set(generateFakeData(state.data.io?.schema, state.data.component));
  }

  const componentInfo = createMemo(() => {
    const state = info();
    return state.status === "done" ? state.data : undefined;
  });

  return { ready, generate, info: componentInfo };
}
