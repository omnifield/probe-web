// Нарушение `solid/reactivity`: `props.name` прочитан в теле компонента, вне отслеживаемой
// области. Значение застынет на первом рендере, изменение до вида не дойдёт.
export function Greeting(props: { name: string }) {
  const label = props.name.toUpperCase();

  return <h1>{label}</h1>;
}
