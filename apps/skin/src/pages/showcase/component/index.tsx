import type { ComponentDescriptor, TagGroup } from "#/entities/component";
import { CatalogList, Slot } from "#/widgets/catalogs";

export function ComponentPage(props: {
  descriptor?: ComponentDescriptor;
  tags: readonly TagGroup[];
}) {
  return (
    <CatalogList items={props.tags}>
      {(item) => (
        <Slot items={item.variants} label={(variant) => variant}>
          {(variant, index) => {
            console.log(variant, index);
            return null;
          }}
        </Slot>
      )}
    </CatalogList>
  );
}
