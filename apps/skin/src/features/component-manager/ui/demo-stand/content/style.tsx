import type { Form } from "@web-core/skin";
import type { PresetRecord } from "@web-core/skin/presets";
import { useComponentSkinData } from "@web-core/skin/solid";

export function StandStyle(props: { component: string; variant: string }) {
  const data = useComponentSkinData<PresetRecord<Form>>(props.component);
  const variantRecipe = () => data()?.state.recipe.variants?.[props.variant];

  return <div>{JSON.stringify(variantRecipe(), null, 2)}</div>;
}
