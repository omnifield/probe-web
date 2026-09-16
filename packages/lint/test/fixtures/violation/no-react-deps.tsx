// Нарушение `solid/no-react-deps`: массив зависимостей у `createEffect` — привычка из
// React. Solid собирает зависимости сам, массив ничего не делает.
import { createEffect, createSignal } from "solid-js";

export function Counter() {
  const [count] = createSignal(0);

  createEffect(() => {
    console.log(count());
  }, [count]);

  return <span>{count()}</span>;
}
