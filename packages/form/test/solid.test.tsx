import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "@web-core/io";
import type { AssemblyTree } from "@web-core/assembly";

import { useComponentValidation, useFormValid, ValidationProvider } from "../src/solid/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const schema = z.object({
  email: z.string().email(),
  subscribeNewsletter: z.boolean(),
});

function buildTree(): AssemblyTree {
  return {
    components: {
      root: "form",
      nodes: {
        form: { id: "form", type: "form", parentId: null, children: ["email", "newsletterBlock"] },
        email: { id: "email", type: "field", parentId: "form", children: [], bind: { value: "/email" } },
        newsletterBlock: {
          id: "newsletterBlock",
          type: "surface",
          parentId: "form",
          children: [],
          meta: {
            rule: {
              effect: "HIDE",
              vars: { subscribed: "/subscribeNewsletter" },
              when: { "==": [{ var: "subscribed" }, false] },
            },
          },
        },
      },
    },
  };
}

function EmailField() {
  const validation = useComponentValidation(undefined, { "data-node": "email" });
  return <span data-testid="email">{validation()?.invalid ? "invalid" : "ok"}</span>;
}

function NewsletterBlock() {
  const validation = useComponentValidation(undefined, {
    "data-node": "newsletterBlock",
    meta: buildTree().components.nodes["newsletterBlock"]?.meta,
  });
  return <span data-testid="block">{validation()?.hidden ? "hidden" : "visible"}</span>;
}

function FormValid() {
  const canSubmit = useFormValid();
  return <span data-testid="valid">{canSubmit() ? "valid" : "invalid"}</span>;
}

describe("@web-core/form solid adapter", () => {
  it("useComponentValidation читает issues по своему пути через data-node, не props.bind", () => {
    const [data, setData] = createSignal<unknown>({ email: "not-an-email", subscribeNewsletter: false });
    const tree = buildTree();

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <ValidationProvider tree={tree} schema={schema} data={data}>
          <EmailField />
        </ValidationProvider>
      ),
      host,
    );

    expect(host.textContent).toBe("invalid");

    setData({ email: "real@example.com", subscribeNewsletter: false });
    expect(host.textContent).toBe("ok");
  });

  it("rule в meta прячет узел, когда JsonLogic-условие совпало, и пересчитывается реактивно", () => {
    const [data, setData] = createSignal<unknown>({ email: "real@example.com", subscribeNewsletter: false });
    const tree = buildTree();

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <ValidationProvider tree={tree} schema={schema} data={data}>
          <NewsletterBlock />
        </ValidationProvider>
      ),
      host,
    );

    expect(host.textContent).toBe("hidden");

    setData({ email: "real@example.com", subscribeNewsletter: true });
    expect(host.textContent).toBe("visible");
  });

  it("useFormValid — агрегат по всему дереву, не по одному пути", () => {
    const [data, setData] = createSignal<unknown>({ email: "not-an-email", subscribeNewsletter: false });
    const tree = buildTree();

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <ValidationProvider tree={tree} schema={schema} data={data}>
          <FormValid />
        </ValidationProvider>
      ),
      host,
    );

    expect(host.textContent).toBe("invalid");

    setData({ email: "real@example.com", subscribeNewsletter: false });
    expect(host.textContent).toBe("valid");
  });
});
