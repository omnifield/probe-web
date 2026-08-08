// Непреобразованный JSX — ровно то, что отдаёт solid-библиотека по условию `solid`.
// Трансформировать его обязан ПОТРЕБИТЕЛЬ, то есть наши `/vite` и `/vitest`.

/**
 * @param {{ text: string }} props
 * @returns {import("solid-js").JSX.Element}
 */
export function DepGreeting(props) {
  return <em data-testid="dep-greeting">{props.text}</em>;
}
