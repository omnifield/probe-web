import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as avatarKit } from "../components/index.js";
import { passport as avatarPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as avatarEditorInfo } from "../playground/index.js";

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
    avatar: { passport: readable(avatarPassport, avatarEditorInfo), parts: avatarKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('avatar "basic" — a real image with an initials fallback, both from data', () => {
  it("carries the image's src/alt and the fallback's text, addressed by the real anatomy", () => {
    const data = { src: "https://i.pravatar.cc/128?img=12", alt: "Jane Doe", fallback: "JD" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(avatarPassport, assembly as PassportAssembly, "avatar", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const root = host.querySelector('[data-scope="avatar"][data-part="root"]');
    expect(root).not.toBeNull();

    const image = host.querySelector('[data-scope="avatar"][data-part="image"]') as HTMLImageElement | null;
    expect(image?.getAttribute("src")).toBe("https://i.pravatar.cc/128?img=12");
    expect(image?.getAttribute("alt")).toBe("Jane Doe");

    const fallback = host.querySelector('[data-scope="avatar"][data-part="fallback"]');
    expect(fallback?.textContent).toBe("JD");
  });
});
