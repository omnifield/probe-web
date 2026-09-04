import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  Dialog,
  DialogContent,
  DialogPositioner,
  DialogTitle,
  DialogTrigger,
  kit as dialogKit,
} from "../components/index.js";
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

const REGISTRY: Registry = createRegistry({
  components: {
    dialog: { passport: readable(dialogPassport, dialogEditorInfo), parts: dialogKit.parts, provider: Dialog },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('dialog "basic" — the floating half, open by default via providerProps', () => {
  it("shows the title/description from data and a close cross, addressed by the real anatomy", () => {
    const data = { title: "Добро пожаловать", description: "Войдите в аккаунт, чтобы продолжить." };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(dialogPassport, assembly as PassportAssembly, "dialog", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="dialog"][data-part="title"]')?.textContent).toBe("Добро пожаловать");
    expect(host.querySelector('[data-scope="dialog"][data-part="description"]')?.textContent).toBe(
      "Войдите в аккаунт, чтобы продолжить.",
    );

    const content = host.querySelector('[data-scope="dialog"][data-part="content"]');
    expect(content?.getAttribute("data-state")).toBe("open");

    const closeTrigger = host.querySelector('[data-scope="dialog"][data-part="close-trigger"]');
    expect(closeTrigger?.textContent).toBe("✕");
  });
});

describe("multiple triggers sharing one dialog", () => {
  it("marks the clicked trigger current and opens the shared dialog", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Dialog>
          <DialogTrigger value="alice">Alice</DialogTrigger>
          <DialogTrigger value="bob">Bob</DialogTrigger>
          <DialogPositioner>
            <DialogContent>
              <DialogTitle>Edit</DialogTitle>
            </DialogContent>
          </DialogPositioner>
        </Dialog>
      ),
      host,
    );

    const triggers = host.querySelectorAll('[data-scope="dialog"][data-part="trigger"]');
    (triggers[1] as HTMLElement).click();
    await Promise.resolve();
    await Promise.resolve();

    expect(triggers[1]!.getAttribute("data-current")).toBe("");
    expect(triggers[0]!.getAttribute("data-current")).toBeNull();
    expect(host.querySelector('[data-scope="dialog"][data-part="content"]')?.getAttribute("data-state")).toBe(
      "open",
    );
  });
});
