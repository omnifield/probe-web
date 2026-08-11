// Четыре канонных нарушения в одном файле — по одному на каждое несущее правило.
import { createEffect, createSignal } from "solid-js";

export function Cart({ title }: { title: string }) {
  const [items] = createSignal<string[]>([]);
  const count = items().length;

  createEffect(() => {
    console.log(count);
  }, [items]);

  if (count === 0) {
    return null;
  }

  return <h2>{title}</h2>;
}
