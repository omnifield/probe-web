// Нарушение `solid/components-return-once`: ранний `return` в компоненте. Тело исполняется
// один раз, поэтому условие обязано быть внутри JSX.
export function Panel(props: { open: boolean; title: string }) {
  if (!props.open) {
    return null;
  }

  return <div>{props.title}</div>;
}
