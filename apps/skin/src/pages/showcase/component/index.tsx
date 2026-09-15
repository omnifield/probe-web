import type { ComponentDescriptor, TagGroup } from "#/entities/component";
import { CatalogList, Slot } from "#/widgets/catalogs";
import { NavigationTabs, useRouterViewSelection } from "#/widgets/navigations";
import { DemoStand } from "#/features/component-manager";

export function ComponentPage(props: {
  component: string;
  descriptor: ComponentDescriptor;
  tags: readonly TagGroup[];
}) {
  const selection = useRouterViewSelection(
    "/showcase/{-$component}/{-$view}",
    "demo",
  );

  return (
    <NavigationTabs
      {...selection}
      content={{
        demo: (
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
                  />
                )}
              </Slot>
            )}
          </CatalogList>
        ),
        info: <div>скоро</div>,
      }}
    />
  );
}
