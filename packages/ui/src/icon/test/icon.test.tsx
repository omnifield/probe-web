import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Icon, kit as iconKit } from "../components/index.js";
import { passport as iconPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as iconEditorInfo } from "../playground/index.js";

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
    icon: { passport: readable(iconPassport, iconEditorInfo), parts: iconKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("Icon — resolves a real lucide icon by name", () => {
  it("renders a real <svg> with the kit's own address, not a placeholder", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <Icon name="chevron-down" />, host);

    const svg = await vi.waitFor(() => {
      const found = host.querySelector('svg[data-scope="icon"][data-part="root"]');
      if (!found) throw new Error("svg not resolved yet");
      return found;
    });

    expect(svg.querySelector("path")).not.toBeNull();
  });

  it("resolves a different name to a visibly different icon", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <Icon name="trash" />, host);

    const svg = await vi.waitFor(() => {
      const found = host.querySelector('svg[data-scope="icon"][data-part="root"]');
      if (!found) throw new Error("svg not resolved yet");
      return found;
    });

    expect(svg.innerHTML).toContain("path");
  });
});

describe('icon "basic" assembly — one icon by fixed name, through the real engine', () => {
  it("renders through RenderTree with the kit's address", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(iconPassport, assembly as PassportAssembly, "icon", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    await vi.waitFor(() => {
      if (!host.querySelector('svg[data-scope="icon"][data-part="root"]')) {
        throw new Error("svg not resolved yet");
      }
    });
  });
});
