import { For, Show, mergeProps } from "solid-js";

export function Cart(rawProps: { items?: readonly string[]; title?: string }) {
  const props = mergeProps({ items: [] as readonly string[], title: "Корзина" }, rawProps);

  return (
    <section>
      <h2>{props.title}</h2>
      <Show when={props.items.length > 0} fallback={<p>пусто</p>}>
        <ul>
          <For each={[...props.items]}>{(item) => <li>{item}</li>}</For>
        </ul>
      </Show>
    </section>
  );
}
