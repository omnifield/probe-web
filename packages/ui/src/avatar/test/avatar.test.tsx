import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@web-core/assembly";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Avatar, AvatarFallback, AvatarImage, kit as avatarKit } from "../components/index.js";
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

describe("Avatar — image load/error really flips visible/hidden between image and fallback", () => {
  it("starts with fallback visible, image hidden — nothing has loaded yet", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
          <AvatarImage src="/jane-doe.jpg" alt="Jane Doe" />
        </Avatar>
      ),
      host,
    );

    const image = host.querySelector('[data-scope="avatar"][data-part="image"]') as HTMLImageElement;
    const fallback = host.querySelector('[data-scope="avatar"][data-part="fallback"]') as HTMLElement;

    expect(fallback.dataset.state).toBe("visible");
    expect(fallback.hasAttribute("hidden")).toBe(false);
    expect(image.dataset.state).toBe("hidden");
    expect(image.hasAttribute("hidden")).toBe(true);
  });

  it("a real load event flips image to visible and fallback to hidden", async () => {
    const statuses: string[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Avatar onStatusChange={(details) => statuses.push(details.status)}>
          <AvatarFallback>JD</AvatarFallback>
          <AvatarImage src="/jane-doe.jpg" alt="Jane Doe" />
        </Avatar>
      ),
      host,
    );

    const image = host.querySelector('[data-scope="avatar"][data-part="image"]') as HTMLImageElement;
    image.dispatchEvent(new Event("load"));
    await Promise.resolve();

    const fallback = host.querySelector('[data-scope="avatar"][data-part="fallback"]') as HTMLElement;

    expect(statuses).toEqual(["loaded"]);
    expect(image.dataset.state).toBe("visible");
    expect(image.hasAttribute("hidden")).toBe(false);
    expect(fallback.dataset.state).toBe("hidden");
    expect(fallback.hasAttribute("hidden")).toBe(true);
  });

  it("a real error event keeps fallback visible, image hidden", async () => {
    const statuses: string[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Avatar onStatusChange={(details) => statuses.push(details.status)}>
          <AvatarFallback>JD</AvatarFallback>
          <AvatarImage src="/broken.jpg" alt="Jane Doe" />
        </Avatar>
      ),
      host,
    );

    const image = host.querySelector('[data-scope="avatar"][data-part="image"]') as HTMLImageElement;
    image.dispatchEvent(new Event("error"));
    await Promise.resolve();

    const fallback = host.querySelector('[data-scope="avatar"][data-part="fallback"]') as HTMLElement;

    expect(statuses).toEqual(["error"]);
    expect(image.dataset.state).toBe("hidden");
    expect(fallback.dataset.state).toBe("visible");
  });
});
