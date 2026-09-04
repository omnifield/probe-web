import {
  createRegistry,
  RenderTree,
  type AssemblyTree,
  type ReadableComponent,
  type Registry,
  type SelfAssembly,
} from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Button, kit } from "../components/index.js";
import { Toggle } from "../../toggle/components/root.js";
import { passport } from "../entity/passport.js";
import { editorInfo } from "../playground/index.js";

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

describe('playground assembly "base" — shows the label from data (PWEB-187/191)', () => {
  it("reads /label absolutely — no repeat wraps this node, scopeTemplate never touches it", () => {
    const assembly = editorInfo.assemblies.find((candidate) => candidate.name === "base")!;
    const tree = baseAssemblyOf(passport, assembly as PassportAssembly, "button", { label: "Оформить заказ" });

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{ label: "Оформить заказ" }} />, host);

    const button = host.querySelector('[data-scope="button"]') as HTMLButtonElement | null;
    expect(button?.textContent).toBe("Оформить заказ");
  });
});

describe("as= — rendering as a different tag keeps the button's own address (FAQ.md)", () => {
  it("as=\"a\" carries data-scope=\"button\"/data-part=\"root\", not the anchor's own anything", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Button as="a" href="/orders">Открыть заказы</Button>, host);

    const anchor = host.querySelector("a");
    expect(anchor?.getAttribute("data-scope")).toBe("button");
    expect(anchor?.getAttribute("data-part")).toBe("root");
    expect(anchor?.getAttribute("href")).toBe("/orders");
  });
});

describe("expanded/pressed — plain attributes the caller sets directly, not through as= (FAQ.md)", () => {
  it("data-expanded/data-pressed set directly on Button keep the button's own address", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Button data-expanded="" data-pressed="">B</Button>, host);

    const button = host.querySelector("button");
    expect(button?.getAttribute("data-scope")).toBe("button");
    expect(button?.hasAttribute("data-expanded")).toBe(true);
    expect(button?.hasAttribute("data-pressed")).toBe(true);
  });
});

describe("as= — a KNOWN LIMIT: targeting another kit component built on Ark loses the button's own address", () => {
  it("as={Toggle} ends up scoped as toggle, not button — button's own skin no longer applies", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Button as={Toggle}>B</Button>, host);

    const button = host.querySelector("button");
    expect(button?.getAttribute("data-scope")).toBe("toggle");
    expect(button?.getAttribute("data-scope")).not.toBe("button");
  });
});
