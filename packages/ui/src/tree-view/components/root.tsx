export function TreeRoot(props) {
  traceLife("ui.tree-view");

  return (
    <ArkRoot>
      <ArkTree>это главный контейнер в нем будет все рисоваться</ArkTree>
    </ArkRoot>
  );
}
