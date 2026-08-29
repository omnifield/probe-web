// Live proof for `passport.selfAssembly` (PWEB-168) and for a bare reference to the button
// unfolding it recursively (PWEB-169) — both through the real mechanism (`baseAssemblyOf`/
// `RenderTree` on a real registry), not a type-level claim.

import {
  createRegistry,
  RenderTree,
  type AssemblyTree,
  type ReadableComponent,
  type Registry,
  type SelfAssembly,
} from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit } from "./components/kit.js";
import { passport } from "./entity/passport.js";
import { editorInfo } from "./playground/index.js";

const readableButton: ReadableComponent = {
  passport: {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    // The mechanic's own `SelfAssembly` is deliberately narrower than the skin's full node
    // vocabulary (no `repeat`/`ref`/nested `component` — `growSelfAssembly` doesn't unfold
    // those, only the shape a self-assembly actually uses today). The button's real tree fits;
    // this cast is exactly the boundary a real per-product registry adapter would also cross —
    // guarded by this test, not by the type checker (same reasoning as `ReadablePassport` itself).
    selfAssembly: passport.selfAssembly as SelfAssembly | undefined,
  },
  parts: kit.parts,
};

const REGISTRY: Registry = createRegistry({
  components: { button: readableButton },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("button's selfAssembly (PWEB-168)", () => {
  it("prints the label from data and dispatches the payload untouched on click", () => {
    const data = { label: "Save", payload: { id: "row-1" } };
    const tree = baseAssemblyOf(
      passport,
      { name: "proof", means: "proof", tree: passport.selfAssembly!.tree },
      "button",
      data,
    );

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

    const button = host.querySelector('[data-scope="button"]') as HTMLButtonElement | null;
    expect(button?.textContent).toBe("Save");

    button?.click();

    expect(dispatched).toEqual([
      expect.objectContaining({ name: "select", context: { payload: { id: "row-1" } } }),
    ]);
  });
});

describe("a bare reference to the button unfolds its selfAssembly (PWEB-169)", () => {
  it("shows the referencing node's own data and dispatches its own payload — no on/children on the reference", () => {
    // A synthetic reference node, standing in for what a `component: "button"` node in someone
    // else's assembly compiles down to: a bare `type: "button"` with a non-null `parentId` (it
    // is nested inside a would-be owner) and ONLY `bind` — no `on`, no `children` of its own.
    const outerData = { title: "Open section", payload: { kind: "section", id: "s1" } };
    const tree: AssemblyTree = {
      components: {
        root: "ref",
        nodes: {
          ref: {
            id: "ref",
            type: "button",
            parentId: "owner",
            children: [],
            bind: { label: "/title", payload: "/payload" },
          },
        },
      },
    };

    const dispatched: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={tree}
          data={outerData}
          dispatch={(event) => dispatched.push(event)}
        />
      ),
      host,
    );

    const button = host.querySelector('[data-scope="button"]') as HTMLButtonElement | null;
    expect(button?.textContent).toBe("Open section");

    button?.click();

    expect(dispatched).toEqual([
      expect.objectContaining({
        name: "select",
        context: { payload: { kind: "section", id: "s1" } },
      }),
    ]);
  });
});

describe("a reference's own literal `props` reach the variant — through `bind`, not a DOM-prop passthrough", () => {
  it("carries a variant the reference names, through data + the button's own bind", () => {
    const tree: AssemblyTree = {
      components: {
        root: "ref",
        nodes: {
          ref: {
            id: "ref",
            type: "button",
            parentId: "owner",
            children: [],
            props: { "data-variant": "tertiary" },
            bind: { label: "/title" },
          },
        },
      },
    };

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={REGISTRY} tree={tree} data={{ title: "Open" }} />,
      host,
    );

    const button = host.querySelector('[data-scope="button"]') as HTMLButtonElement | null;
    expect(button?.getAttribute("data-variant")).toBe("tertiary");
  });

  it("sets no attribute at all when the reference names no variant — the kit owns no default name", () => {
    const tree: AssemblyTree = {
      components: {
        root: "ref",
        nodes: {
          ref: {
            id: "ref",
            type: "button",
            parentId: "owner",
            children: [],
            bind: { label: "/title" },
          },
        },
      },
    };

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={REGISTRY} tree={tree} data={{ title: "Open" }} />,
      host,
    );

    const button = host.querySelector('[data-scope="button"]') as HTMLButtonElement | null;
    expect(button?.hasAttribute("data-variant")).toBe(false);
  });
});
