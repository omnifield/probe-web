import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Switch, SwitchControl, SwitchLabel, SwitchThumb, kit as switchKit } from "../components/index.js";
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

describe("real click toggles the switch and moves the thumb", () => {
  it("clicking the root flips checked to unchecked and back", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Switch defaultChecked>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>Уведомления</SwitchLabel>
        </Switch>
      ),
      host,
    );

    const root = host.querySelector('[data-scope="switch"][data-part="root"]') as HTMLLabelElement;
    expect(root.getAttribute("data-state")).toBe("checked");

    root.click();
    await Promise.resolve();
    expect(root.getAttribute("data-state")).toBe("unchecked");

    root.click();
    await Promise.resolve();
    expect(root.getAttribute("data-state")).toBe("checked");
  });
});

describe("real form field — name/value make it a native checkbox for FormData", () => {
  it("carries the checked value into FormData under its own name, nothing when unchecked", () => {
    let form!: HTMLFormElement;
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <form ref={form}>
          <Switch name="notifications" value="on" defaultChecked>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <SwitchLabel>Уведомления</SwitchLabel>
          </Switch>
        </form>
      ),
      host,
    );

    expect(new FormData(form).get("notifications")).toBe("on");

    const root = host.querySelector('[data-scope="switch"][data-part="root"]') as HTMLLabelElement;
    root.click();

    expect(new FormData(form).get("notifications")).toBeNull();
  });
});
