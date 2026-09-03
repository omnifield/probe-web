import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as switchKit } from "../components/index.js";
import { passport as switchPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as switchEditorInfo } from "../playground/index.js";

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
    switch: { passport: readable(switchPassport, switchEditorInfo), parts: switchKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('switch "basic" — checked by default, label from data', () => {
  it("shows the label from data and mounts the thumb at the checked position", () => {
    const data = { label: "Уведомления" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(switchPassport, assembly as PassportAssembly, "switch", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const root = host.querySelector('[data-scope="switch"][data-part="root"]');
    expect(root?.getAttribute("data-state")).toBe("checked");

    const label = host.querySelector('[data-scope="switch"][data-part="label"]');
    expect(label?.textContent).toBe("Уведомления");

    const thumb = host.querySelector('[data-scope="switch"][data-part="thumb"]');
    expect(thumb?.getAttribute("data-state")).toBe("checked");

    const hiddenInput = host.querySelector('input[type="checkbox"]');
    expect(hiddenInput).not.toBeNull();
    expect((hiddenInput as HTMLInputElement).checked).toBe(true);
  });
});
