export function Feed(props: { feedData: unknown }) {
  return <div>{JSON.stringify(props.feedData, null, 2)}</div>;
}
