// Live proof for PWEB-170: an empty bind path inside a `repeat` template must resolve to the
// CURRENT array element as a whole, not to `undefined` — the same meaning an empty path already
// carries outside a repeat (RFC 6901: an empty pointer means "the whole document"), just made to
// survive `scopeTemplate`'s relative-path rebasing.

import { describe, expect, it } from "vitest";
import { createAnatomy } from "@zag-js/anatomy";

import { baseAssemblyOf, resolveDataBinding } from "../src/passport/assembly/index.js";
import { definePassport } from "../src/passport/form/index.js";

const anatomy = createAnatomy("list").parts("root", "row");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "row", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

describe("empty bind path inside a repeat (PWEB-170)", () => {
  it("resolves to the whole current element, not a field on it", () => {
    const data = {
      rows: [
        { id: "a", label: "First" },
        { id: "b", label: "Second" },
      ],
    };

    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: {
          node: "root",
          children: [
            {
              repeat: { path: "/rows" },
              template: { node: "row", bind: { value: "id", whole: "" } },
            },
          ],
        },
      },
      "list",
      data,
    );

    const rows = Object.values(tree.components.nodes).filter(
      (node): node is Extract<typeof node, { readonly type: string }> => "type" in node && node.type === "list.row",
    );

    expect(rows).toHaveLength(2);

    const firstRowPath = rows[0]!.bind!.whole;
    const secondRowPath = rows[1]!.bind!.whole;

    expect(resolveDataBinding(data, firstRowPath)).toEqual({ id: "a", label: "First" });
    expect(resolveDataBinding(data, secondRowPath)).toEqual({ id: "b", label: "Second" });
  });
});
