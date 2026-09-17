export function Style(props: { styleData: unknown }) {
  return <div>{JSON.stringify(props.styleData, null, 2)}</div>;
}
