import type { DispatchedEvent } from "@web-core/assembly";
import { createAtom, createResourceAtom } from "@web-core/store";
import { createSignal } from "solid-js";

import { componentInfo } from "./info";
import { listComponents } from "./list";
import { treeItems } from "./tree";

export const componentsAtom = createResourceAtom(() => listComponents());
export const componentTreeAtom = createResourceAtom(() => treeItems());

export const [currentComponent, setCurrentComponent] = createSignal<string | undefined>();

export const componentInfoAtom = createResourceAtom(currentComponent, (component) =>
  component === undefined ? Promise.resolve(undefined) : componentInfo(component),
);

/** Данные активного компонента для показа (`Preview`'s `data`) — пишет `Input` (фейк-генератором,
 *  сам на смену компонента и по кнопке вручную), читает витрина. */
export const componentDataAtom = createAtom<unknown>(undefined);

/** История событий, продиктованных активным компонентом — пока он не сменился (сброс — `handle.ts`).
 *  Пишет витрина через `componentHandle().recordEvent`, читает `Output`. */
export const componentEventsAtom = createAtom<readonly DispatchedEvent[]>([]);
