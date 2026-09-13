import { Flow } from "@web-core/ui";
import { createEffect } from "solid-js";

import { assembliesOf, variantsOf } from "#/entities/component";
import { CatalogList, type ListItem } from "#/widgets/catalogs";

const MOCK_ITEMS: readonly ListItem[] = [
  { value: "one", label: "One" },
  { value: "two", label: "Two" },
  { value: "three", label: "Three" },
];

export function ShowcasePage(props: { component: string; tag?: string }) {
  createEffect(() => {
    const component = props.component;
    void variantsOf(component).then((variants) => console.log(variants));
    void assembliesOf(component).then((assemblies) => console.log(assemblies));
  });

  return (
    <Flow data-variant="column-center">
      <CatalogList items={MOCK_ITEMS}>{(item) => <div>{item.label}</div>}</CatalogList>
    </Flow>
  );
}
