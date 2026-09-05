import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as workspaceKit, Workspace } from "../components/index.js";
import { passport as workspacePassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as workspaceEditorInfo } from "../playground/index.js";

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
    workspace: { passport: readable(workspacePassport, workspaceEditorInfo), parts: workspaceKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const mount = (name: string): HTMLElement => {
  const assembly = assemblies.find((candidate) => candidate.name === name)!;
  const tree = baseAssemblyOf(workspacePassport, assembly as PassportAssembly, "workspace", {});

  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);
  return host;
};

const partsOf = (host: HTMLElement) =>
  [...host.querySelectorAll("[data-scope=\"workspace\"][data-part]")].map((el) => el.getAttribute("data-part"));

describe('workspace "stacked" — only the slots the assembly names exist at all', () => {
  it("mounts header and main, and nothing else", () => {
    const host = mount("stacked");
    expect(partsOf(host).sort()).toEqual(["header", "main", "root"].sort());
    expect(host.querySelector('[data-scope="workspace"][data-part="header"]')?.textContent).toBe("Шапка");
    expect(host.querySelector('[data-scope="workspace"][data-part="main"]')?.textContent).toBe("Показ");
  });
});

describe('workspace "holy-grail" — all six slots at once', () => {
  it("mounts every named slot", () => {
    const host = mount("holy-grail");
    expect(partsOf(host).sort()).toEqual(["footer", "header", "main", "rightbar", "root", "sidebar"].sort());
  });
});

describe("workspace's own root", () => {
  it("carries no data-outlined by default", () => {
    const host = mount("stacked");
    const root = host.querySelector('[data-scope="workspace"][data-part="root"]');
    expect(root?.hasAttribute("data-outlined")).toBe(false);
  });

  it("carries the literal string data-outlined=\"true\" when the outlined prop is set", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Workspace outlined>content</Workspace>, host);

    const root = host.querySelector('[data-scope="workspace"]');
    expect(root?.getAttribute("data-outlined")).toBe("true");
  });
});
