export function TreeItem(props) {
  traceLife("ui.tree-item-control");

  return (
    <TreeView.NodeProvider>
      <TreeView.Branch>
        сюда будет подставляться то что заданно в схеме, это контент и контрол,
        оба могут наполняться чем угодно, сами контейнера нужны для механик
        арка.
      </TreeView.Branch>
    </TreeView.NodeProvider>
  );
}
