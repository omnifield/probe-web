import type { DispatchedEvent } from "@web-core/assembly";
import { createAtom, createResourceAtom } from "@web-core/store";
import { createSignal } from "solid-js";

export const [currentComponent, setCurrentComponent] = createSignal<string | undefined>();

// МОК — реальная сборка (паспорт+editorInfo+io переехали на componentDescriptorOf, форма — на
// useComponentSkinData, `api/skin-data.ts`) сюда пока не подключена, стор временно не нужен.
export const componentInfoAtom = createResourceAtom(currentComponent, () => Promise.resolve(undefined));

/** Данные активного компонента для показа (`Preview`'s `data`) — пишет `Input` (фейк-генератором,
 *  сам на смену компонента и по кнопке вручную), читает витрина. */
export const componentDataAtom = createAtom<unknown>(undefined);

/** История событий, продиктованных активным компонентом — пока он не сменился. Читателя пока нет. */
export const componentEventsAtom = createAtom<readonly DispatchedEvent[]>([]);
