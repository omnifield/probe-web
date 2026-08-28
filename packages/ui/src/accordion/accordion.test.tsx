// Live proof for the "с-кнопками" assembly (playground/assemblies.ts) — the real motivating case
// for PWEB-167–172: the trigger dispatches the whole section via a plain path (""), and each
// item's content is a real Button reference fed by data only (bind, no on/children restated).

import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as accordionKit } from "./components/kit.js";
import { passport as accordionPassport } from "./entity/passport.js";
import { assemblies } from "./playground/assemblies.js";
import { editorInfo as accordionEditorInfo } from "./playground/index.js";

import { kit as buttonKit } from "../button/components/kit.js";
import { passport as buttonPassport } from "../button/entity/passport.js";
import { editorInfo as buttonEditorInfo } from "../button/playground/index.js";

function readable(passport: typeof accordionPassport, editorInfo: typeof accordionEditorInfo): ReadableComponent["passport"] {
  return {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- narrow-shape boundary, same as button.test.tsx
    selfAssembly: passport.selfAssembly as any,
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    accordion: { passport: readable(accordionPassport, accordionEditorInfo), parts: accordionKit.parts },
    button: { passport: readable(buttonPassport as never, buttonEditorInfo), parts: buttonKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('accordion "с-кнопками" — real Button per item, section payload from the trigger', () => {
  it("shows section titles on triggers, item titles on buttons, and dispatches whole nodes as payload", () => {
    const data = {
      sections: [
        {
          id: "s1",
          title: "Section 1",
          items: [
            { id: "i1", title: "Item 1" },
            { id: "i2", title: "Item 2" },
          ],
        },
      ],
    };

    const assembly = assemblies.find((candidate) => candidate.name === "с-кнопками")!;
    const tree = baseAssemblyOf(accordionPassport, assembly, "accordion", data);

    const dispatched: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={tree}
          data={data}
          dispatch={(event) => dispatched.push(event)}
        />
      ),
      host,
    );

    const trigger = host.querySelector('[data-scope="accordion"][data-part="item-trigger"]') as HTMLElement | null;
    expect(trigger?.textContent).toBe("Section 1");

    const buttons = [...host.querySelectorAll('[data-scope="button"]')] as HTMLButtonElement[];
    expect(buttons.map((button) => button.textContent)).toEqual(["Item 1", "Item 2"]);

    trigger?.click();
    buttons[1]!.click();

    expect(dispatched).toEqual([
      expect.objectContaining({
        name: "triggerClick",
        context: { payload: { id: "s1", title: "Section 1", items: data.sections[0]!.items } },
      }),
      expect.objectContaining({
        name: "select",
        context: { payload: { id: "i2", title: "Item 2" } },
      }),
    ]);
  });
});
