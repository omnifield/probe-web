import { PRESET_KIND, type PresetKind, type PresetRecord, type PresetsClient } from "@web-core/skin/presets";
import type { Form, Outfit } from "@web-core/skin/model";
import { describe, expect, it } from "vitest";

import { createComponentInfo } from "../src/component-info.js";

function formRecord(name: string, component: string, form: Partial<Form> = {}): PresetRecord<Form> {
  return {
    id: name,
    label: name,
    name,
    kind: PRESET_KIND.form,
    savedAt: "2026-09-10T00:00:00Z",
    state: { name, component, recipe: {}, ...form },
  };
}

function outfitRecord(name: string, forms: readonly string[]): PresetRecord<Outfit> {
  return {
    id: name,
    label: name,
    name,
    kind: PRESET_KIND.outfit,
    savedAt: "2026-09-10T00:00:00Z",
    state: { name, palette: "test", forms },
  };
}

function fakePresets(forms: readonly PresetRecord<Form>[], outfits: readonly PresetRecord<Outfit>[]): PresetsClient {
  return {
    list: async (kind: PresetKind) => {
      if (kind === PRESET_KIND.form) return forms as never;
      if (kind === PRESET_KIND.outfit) return outfits as never;
      return [];
    },
    get: async () => undefined,
    save: async () => {
      throw new Error("not used in this test");
    },
    replace: async () => {
      throw new Error("not used in this test");
    },
    remove: async () => {
      throw new Error("not used in this test");
    },
  };
}

describe("createComponentInfo — несколько сохранённых форм на один компонент (PWEB, component-info-multiple-forms-per-component)", () => {
  it("отдаёт ВСЕ формы компонента, не первую попавшуюся", async () => {
    const plain = formRecord("omnifield-date-picker", "date-picker");
    const outline = formRecord("omnifield-date-picker-outline", "date-picker", {
      recipe: { variants: { outline: {} } },
      variantTags: { outline: ["default"] },
    });
    const other = formRecord("other-component-form", "select");

    const outfitWithBoth = outfitRecord("outfit-both", [plain.name, outline.name]);
    const outfitWithOutlineOnly = outfitRecord("outfit-outline", [outline.name]);

    const presets = fakePresets([plain, outline, other], [outfitWithBoth, outfitWithOutlineOnly]);
    const componentInfo = createComponentInfo({ presets });

    const info = await componentInfo("date-picker");

    expect(info.skin).toBeDefined();
    expect(info.skin?.forms).toHaveLength(2);
    expect(info.skin?.forms.map((entry) => entry.form.name)).toEqual([plain.name, outline.name]);

    const plainInfo = info.skin?.forms.find((entry) => entry.form.name === plain.name);
    expect(plainInfo?.variants).toEqual([]);
    expect(plainInfo?.outfits).toEqual([outfitWithBoth.name]);
    expect(plainInfo?.tags).toEqual([]);

    const outlineInfo = info.skin?.forms.find((entry) => entry.form.name === outline.name);
    expect(outlineInfo?.variants).toEqual(["outline"]);
    expect(outlineInfo?.outfits).toEqual([outfitWithBoth.name, outfitWithOutlineOnly.name]);
    expect(outlineInfo?.tags).toEqual([{ tag: "default", variants: ["outline"] }]);
  });

  it("остаётся undefined, если для компонента ещё не сохраняли ни одной формы", async () => {
    const presets = fakePresets([formRecord("some-form", "select")], []);
    const componentInfo = createComponentInfo({ presets });

    const info = await componentInfo("date-picker");

    expect(info.skin).toBeUndefined();
  });
});
