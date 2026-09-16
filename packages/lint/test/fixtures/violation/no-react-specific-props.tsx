// Нарушение `solid/no-react-specific-props`: `className` — React-prop, помеченный
// устаревшим в Solid v1.4.0.
export function Badge() {
  return <span className="badge">новое</span>;
}
