import type { JSX } from "solid-js";

import { dropAddress } from "../utils/slot-chain.js";
import { traceLife } from "../utils/trace.js";

// ОБЩИЙ шаблон для части анатомии, которую завёл САМ кит, не Ark (постановка user, 2026-09-01:
// «подобные вещи сразу добавлять и юзать в src/shared» — та же логика, что уже привела сюда
// `collection.ts`: не по копии на каждый компонент, у которого такая часть есть).
//
// Часть без коннектора Ark — просто `<div>` с адресом, снятым из ДОСТРОЕННОЙ анатомии
// (`entity/anatomy.ts`'s `extendWith`, не `getXxxProps()`, которого для такой части не
// существует). Первый живой случай — `tree-view`'s `itemContent`/`itemTrigger`: Ark не делит
// лист на «шапку» и «открытый слот» сам, это наше собственное решение, сделанное настоящим через
// тот же построитель анатомии, каким Ark строит родные части — не приближение, не заглушка.
//
// `name` — для `traceLife` (`ui.tree-view-item-content`, не голое `TreeViewItemContent`): тот же
// формат трейса, что у любого другого примитива кита.
export function ownPart(name: string, attrs: Readonly<Record<string, string>>) {
  return function OwnPart(props: JSX.HTMLAttributes<HTMLDivElement>) {
    traceLife(name);

    return <div {...dropAddress(props)} {...attrs} />;
  };
}
