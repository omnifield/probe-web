import type { JSX } from "solid-js";
import type { ComponentDescriptor, TagGroup } from "#/entities/component";
import { DemoStand } from "#/features/component-manager";
import { CatalogList, Slot } from "#/widgets/catalogs";
import { NavigationTabs, useRouterViewSelection } from "#/widgets/navigations";

export function ComponentPage(props: {
  component: string;
  descriptor: ComponentDescriptor;
  tags: readonly TagGroup[];
}) {
  const selection = useRouterViewSelection(
    "/showcase/{-$component}/{-$view}",
    "demo",
  );

  const tab = (mode: "demo" | "style" | "assembly"): JSX.Element => (
    <CatalogList items={props.tags}>
      {(item) => (
        <Slot
          size={props.descriptor.editorInfo?.footprint}
          items={item.variants}
          label={(variant) => variant}
        >
          {(variant) => (
            <DemoStand
              component={props.component}
              descriptor={props.descriptor}
              variant={variant}
              mode={mode}
            />
          )}
        </Slot>
      )}
    </CatalogList>
  );

  return (
    <NavigationTabs
      {...selection}
      content={{
        demo: tab("demo"),
        style: tab("style"),
        assembly: tab("assembly"),
      }}
    />
  );
}
