import { useComponentSkinData as useComponentSkinDataBase } from "@web-core/skin/solid";
import type { PresetRecord } from "@web-core/skin/presets";
import type { Form } from "@web-core/skin/model";

export function useComponentSkinData(component: string) {
  return useComponentSkinDataBase<PresetRecord<Form>>(component);
}
