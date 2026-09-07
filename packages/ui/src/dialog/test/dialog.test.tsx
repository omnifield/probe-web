import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { createContext, useContext } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogControl, kit as dialogKit } from "../components/index.js";
import { passport as dialogPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as dialogEditorInfo } from "../playground/index.js";

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

// `provider: dialogKit.provider` — the REAL kit-declared provider, not a hardcoded re-import of
// `Dialog`. A hardcoded provider would keep this test green even if `defineKitComponent`'s third
// argument were ever dropped from `components/index.ts` — found live exactly this way (the
// showcase app threw `useDialogContext returned undefined` while a test with a hardcoded provider
// still passed).
const REGISTRY: Registry = createRegistry({
  components: {
    dialog: { passport: readable(dialogPassport, dialogEditorInfo), parts: dialogKit.parts, provider: dialogKit.provider },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('dialog "basic" — pure mechanics, open by default via providerProps, content is an empty slot', () => {
  it("addresses content by the real anatomy, and renders whatever the consumer puts inside it", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(dialogPassport, assembly as PassportAssembly, "dialog", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={tree}
          data={{}}
          slots={{
            dialog: { render: () => <p>Собственная разметка потребителя</p>, placement: "replace" },
          }}
        />
      ),
      host,
    );

    const content = document.querySelector('[data-scope="dialog"][data-part="content"]');
    expect(content?.getAttribute("data-state")).toBe("open");
    expect(content?.textContent).toContain("Собственная разметка потребителя");

    expect(document.querySelector('[data-scope="dialog"][data-part="backdrop"]')).not.toBeNull();
    expect(document.querySelector('[data-scope="dialog"][data-part="close-trigger"]')?.textContent).toBe("✕");
  });
});

describe("context flows through DialogContent's Portal into the consumer's own element", () => {
  it("a Context.Provider placed around DialogContent reaches a component rendered inside it", () => {
    const Greeting = createContext("no context");

    function ReadsGreeting() {
      return <p data-testid="greeting">{useContext(Greeting)}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Greeting.Provider value="hello from outside the portal">
          <Dialog defaultOpen>
            <DialogControl>Open</DialogControl>
            <DialogContent>
              <ReadsGreeting />
            </DialogContent>
          </Dialog>
        </Greeting.Provider>
      ),
      host,
    );

    expect(document.querySelector('[data-testid="greeting"]')?.textContent).toBe(
      "hello from outside the portal",
    );
  });
});

describe("multiple controls sharing one dialog", () => {
  it("marks the clicked control current and opens the shared dialog", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Dialog>
          <DialogControl value="alice">Alice</DialogControl>
          <DialogControl value="bob">Bob</DialogControl>
          <DialogContent>
            <p>Edit</p>
          </DialogContent>
        </Dialog>
      ),
      host,
    );

    const controls = host.querySelectorAll('[data-scope="dialog"][data-part="control"]');
    (controls[1] as HTMLElement).click();
    await Promise.resolve();
    await Promise.resolve();

    expect(controls[1]!.getAttribute("data-current")).toBe("");
    expect(controls[0]!.getAttribute("data-current")).toBeNull();
    expect(document.querySelector('[data-scope="dialog"][data-part="content"]')?.getAttribute("data-state")).toBe(
      "open",
    );
  });
});
