import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as checkboxKit } from "../components/index.js";
import { passport as checkboxPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as checkboxEditorInfo } from "../playground/index.js";

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
    checkbox: { passport: readable(checkboxPassport, checkboxEditorInfo), parts: checkboxKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('checkbox "basic" — label from data, real toggle on click', () => {
  it("shows the label from data and starts unchecked with the indicator hidden", () => {
    const data = { label: "Согласен с условиями" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(checkboxPassport, assembly as PassportAssembly, "checkbox", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="checkbox"][data-part="label"]')?.textContent).toBe("Согласен с условиями");

    const control = host.querySelector('[data-scope="checkbox"][data-part="control"]');
    expect(control?.getAttribute("data-state")).toBe("unchecked");

    const indicator = host.querySelector('[data-scope="checkbox"][data-part="indicator"]');
    expect(indicator?.hasAttribute("hidden")).toBe(true);
  });

  it("toggles to checked on click, showing the indicator", async () => {
    const data = { label: "Согласен с условиями" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(checkboxPassport, assembly as PassportAssembly, "checkbox", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const root = host.querySelector('[data-scope="checkbox"][data-part="root"]') as HTMLLabelElement;
    root.click();
    await Promise.resolve();

    const control = host.querySelector('[data-scope="checkbox"][data-part="control"]');
    expect(control?.getAttribute("data-state")).toBe("checked");

    const indicator = host.querySelector('[data-scope="checkbox"][data-part="indicator"]');
    expect(indicator?.hasAttribute("hidden")).toBe(false);
    expect(indicator?.textContent).toBe("✓");
  });
});
