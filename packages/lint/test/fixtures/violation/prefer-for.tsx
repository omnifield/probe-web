// Нарушение `solid/prefer-for`: `.map()` в JSX вместо `<For />` — узлы пересоздаются
// целиком вместо сверки по элементу.
export function Numbers(props: { items: number[] }) {
  return <ul>{props.items.map((item) => <li>{item}</li>)}</ul>;
}
