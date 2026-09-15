import { createEffect } from "solid-js";
import { useParams } from "@web-core/router";

export function ComponentPage() {
  const params = useParams({ strict: false });

  createEffect(() => {
    console.log(params().component);
  });

  return (
    <div>wdad</div>
    // <CatalogList items={groups()}>
    //   {(item) => <ComponentStand item={item} />}
    // </CatalogList>
  );
}
