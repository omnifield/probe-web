import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@web-core/assembly";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as radioGroupKit } from "../components/index.js";
import { passport as radioGroupPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as radioGroupEditorInfo } from "../playground/index.js";

function readable<Part extends string, Data = unknown>(
  passport: ComponentPassport<Part>,
  editorInfo: PassportEditorInfo<Part, string, Data>,
): ReadableComponent["passport"] {
  return {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    selfAssembly: passport.selfAssembly as any,
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    "radio-group": { passport: readable(radioGroupPassport, radioGroupEditorInfo), parts: radioGroupKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('radio group "basic" — label and items from data, one choice at a time', () => {
  it("shows the label and every item's text, none checked without a default value", () => {
    const data = {
      label: "Delivery",
      items: [
        { value: "standard", label: "Standard" },
        { value: "express", label: "Express" },
        { value: "pickup", label: "Pickup" },
      ],
    };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(radioGroupPassport, assembly as PassportAssembly, "radio-group", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="radio-group"][data-part="label"]')?.textContent).toBe("Delivery");

    const items = [...host.querySelectorAll('[data-scope="radio-group"][data-part="item-text"]')];
    expect(items.map((item) => item.textContent)).toEqual(["Standard", "Express", "Pickup"]);

    const controls = host.querySelectorAll('[data-scope="radio-group"][data-part="item-control"]');
    expect([...controls].every((control) => control.getAttribute("data-state") === "unchecked")).toBe(true);
  });

  it("checks the clicked item and unchecks the rest", async () => {
    const data = {
      label: "Delivery",
      items: [
        { value: "standard", label: "Standard" },
        { value: "express", label: "Express" },
      ],
    };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(radioGroupPassport, assembly as PassportAssembly, "radio-group", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const [firstItem, secondItem] = [...host.querySelectorAll('[data-scope="radio-group"][data-part="item"]')];
    (secondItem as HTMLElement).click();
    await Promise.resolve();

    const controls = [...host.querySelectorAll('[data-scope="radio-group"][data-part="item-control"]')];
    expect(controls[0]!.getAttribute("data-state")).toBe("unchecked");
    expect(controls[1]!.getAttribute("data-state")).toBe("checked");

    expect(firstItem!.getAttribute("data-state")).toBe("unchecked");
    expect(secondItem!.getAttribute("data-state")).toBe("checked");
  });
});
