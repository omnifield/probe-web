import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as fieldKit } from "../components/index.js";
import { passport as fieldPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as fieldEditorInfo } from "../playground/index.js";

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
    field: { passport: readable(fieldPassport, fieldEditorInfo), parts: fieldKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('field "basic" — required and invalid, both from data', () => {
  it("shows the label/helper/error text from data and mounts the required + error nodes", () => {
    const data = { label: "Имя", helperText: "Как в документе", errorText: "Поле обязательно" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(fieldPassport, assembly as PassportAssembly, "field", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const root = host.querySelector('[data-scope="field"][data-part="root"]');
    expect(root?.getAttribute("data-invalid")).toBe("");

    const label = host.querySelector('[data-scope="field"][data-part="label"]');
    expect(label?.textContent).toBe("Имя*");
    expect(label?.getAttribute("data-required")).toBe("");

    const input = host.querySelector('[data-scope="field"][data-part="input"]');
    expect(input?.getAttribute("required")).not.toBeNull();
    expect(input?.getAttribute("aria-invalid")).toBe("true");

    expect(host.querySelector('[data-scope="field"][data-part="helper-text"]')?.textContent).toBe("Как в документе");
    expect(host.querySelector('[data-scope="field"][data-part="error-text"]')?.textContent).toBe("Поле обязательно");
  });
});
