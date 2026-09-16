// Нарушение `solid/no-destructure`: деструктуризация `props` в СПИСКЕ ПАРАМЕТРОВ — ровно
// та форма, которую правило видит.
export function Greeting({ name }: { name: string }) {
  return <h1>{name}</h1>;
}
