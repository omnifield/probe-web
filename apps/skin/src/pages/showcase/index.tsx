import { componentStore } from "#/entities/component";
import { DemoStand } from "#/features/component-manager";
import { CatalogList } from "#/widgets/catalogs";

export function ShowcasePage() {
  const groups = componentStore.selectors.variantsByTag;

  return (
    <CatalogList items={groups()}>
      {(item) => <DemoStand item={item} />}
    </CatalogList>
  );
}
