// Фикстура-канон: условие и перебор живут ВНУТРИ JSX (`<Show />`, `<For />`), эффект
// собирает зависимости сам. Пресет обязан молчать.
import { For, Show, createEffect, createSignal } from "solid-js";

export function Numbers(props: { items: readonly number[] }) {
  const [selected, setSelected] = createSignal<number>();

  createEffect(() => {
    console.log("выбрано", selected());
  });

  return (
    <Show when={props.items.length > 0} fallback={<p>пусто</p>}>
      <ul>
        <For each={[...props.items]}>
          {(item) => <li onClick={() => setSelected(item)}>{item}</li>}
        </For>
      </ul>
    </Show>
  );
}
