// СЛОТ ПОКАЗА — место витрины, куда ставится показываемое. Сам ничего не рисует и не знает, ЧТО
// в нём покажут — обычный контейнер, содержимое кладёт тот, кто его использует.
import type { JSX } from "solid-js";

export function Slot(props: { children: JSX.Element }) {
  return <div>{props.children}</div>;
}
