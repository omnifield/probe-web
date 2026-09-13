import { Surface } from "@web-core/ui";
import { createEffect, createSignal } from "solid-js";
import { useSkin } from "@web-core/skin/solid";
import {
  assembliesOf,
  contentOf,
  outfitsOf,
  palettesOf,
  tagsOf,
  variantsOf,
} from "#/entities/component";
import { CatalogList } from "#/widgets/catalogs";
import { groupByTag, type TagGroup } from "@web-core/skin/tags";
import { DemoStand } from "#/features/component-manager/ui";

export function ShowcasePage(props: { component: string; tag?: string }) {
  const skin = useSkin();
  const [byTag, setByTag] = createSignal<readonly TagGroup[]>([]);

  createEffect(() => {
    const component = props.component;
    const outfitName = skin.worn()?.name;
    void outfitsOf().then((outfits) => console.log("outfits", outfits));
    void palettesOf().then((palettes) => console.log("palettes", palettes));

    void assembliesOf(component).then((assemblies) =>
      console.log("assemblies", assemblies),
    );
    void contentOf(component).then((content) =>
      console.log("content", content),
    );
    void tagsOf().then((tags) => console.log("tags", tags));
    if (outfitName !== undefined) {
      void variantsOf(outfitName, component).then((variants) => {
        setByTag(groupByTag(variants));
      });
    }
  });

  return (
    <Surface data-variant="filled">
      <CatalogList items={byTag()}>
        {(group) => <DemoStand component={props.component} group={group} />}
      </CatalogList>
    </Surface>
  );
}
