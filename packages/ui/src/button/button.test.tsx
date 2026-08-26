// Button tests — behavior AND passport, next to the component itself (`PWEB-2`).
//
// A component is not just markup, it is a set: markup, anatomy, tests. While they lived in
// parallel folders, "what is a button" had to be assembled in your head from four locations, and
// there was no way to see what the component was missing at all. Now incompleteness is visible in
// the tree.
//
// THE PASSPORT'S MAIN RULE: it declares nothing unobservable. Everything written in
// `button.anatomy.ts` is checked here on a LIVE component — put it in markup, looked at it. So
// the check runs both ways:
//
//   1. a declared part appears in markup with the address attributes FROM THE ANATOMY;
//   2. an address attribute found in markup is declared in the anatomy.
//
// This check cannot be one-sided: the first side catches a promise with no node (a skin rule
// exists, nothing to hook onto), the second catches a node with no promise (a part would stay
// undressed even on a fully "dressed" component).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { skinGaps, type Outfit } from "@omnifield/probe-web-skin/model";
import { admits, GROUPS, groupOf } from "@omnifield/probe-web-skin/editor";
import { cleanup, mount, one } from "../../test/dom.jsx";
import { palette } from "../../test/palette.js";
import { assemble, generateSkinCss } from "../../test/skin.js";
import { Popover, PopoverTrigger } from "../popover.jsx";
import { Toggle } from "../toggle.jsx";
import { anatomy, parts, passport } from "./button.anatomy.js";
import { editorInfo } from "./button.editor.js";
import { Button } from "./button.jsx";
import { form } from "./button.recipe.js";

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(here, "..", "..", "package.json"), "utf8"),
) as { name: string };

/** A scene where ALL of the component's parts are visible at once. The button has one part. */
const scene = () => <Button>Submit</Button>;

/** Address attributes that actually reached the nodes: `data-part` together with its `data-scope`. */
function addressesInDocument(host: ParentNode): Array<{ scope: string; part: string }> {
  return [...host.querySelectorAll("[data-part]")].map((node) => ({
    scope: node.getAttribute("data-scope") ?? "",
    part: node.getAttribute("data-part") ?? "",
  }));
}

describe("Button", () => {
  it("renders ONE `<button>` node and nothing around it", () => {
    const host = mount(() => <Button>Save</Button>);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("BUTTON");
    expect(host.textContent).toBe("Save");
  });

  it("sets `type=button` — a button inside a form does not submit it on click", () => {
    const host = mount(() => <Button>Show</Button>);

    expect(one<HTMLButtonElement>(host, "button").type).toBe("button");
  });

  it("the consumer's `type` wins — a submit button can be assembled", () => {
    const host = mount(() => <Button type="submit">Send</Button>);

    expect(one<HTMLButtonElement>(host, "button").type).toBe("submit");
  });

  it("a disabled button carries both the native `disabled` and `data-disabled`", () => {
    const host = mount(() => <Button disabled>Cannot</Button>);
    const node = one<HTMLButtonElement>(host, "button");

    expect(node.disabled).toBe(true);
    // `data-disabled` is the CSS hook: a disabled button has neither `:hover` nor its own class,
    // and without the attribute the state would not be visible from the outside.
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });

  it("a disabled button does not call its handler", () => {
    const onClick = vi.fn();
    const host = mount(() => (
      <Button disabled onClick={onClick}>
        Cannot
      </Button>
    ));

    one<HTMLButtonElement>(host, "button").click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("with `as='a'` it stays a link — no role swap", () => {
    const host = mount(() => (
      <Button as="a" href="/docs">
        Documentation
      </Button>
    ));
    const node = one<HTMLAnchorElement>(host, "a");

    expect(host.children.length).toBe(1);
    expect(node.getAttribute("href")).toBe("/docs");
    // `<a href>` already has the link role; `role="button"` here would lie to a screen reader.
    expect(node.hasAttribute("role")).toBe(false);
    expect(node.hasAttribute("type")).toBe(false);
  });

  it("with `as='div'` it adds the role and focusability a div lacks", () => {
    const host = mount(() => <Button as="div">Pseudo-button</Button>);
    const node = one(host, "div");

    expect(node.getAttribute("role")).toBe("button");
    expect(node.getAttribute("tabindex")).toBe("0");
  });

  it("a disabled NON-native button declares it via `aria-disabled`", () => {
    const host = mount(() => (
      <Button as="div" disabled>
        Cannot
      </Button>
    ));
    const node = one(host, "div");

    // A `<div>` has no `disabled` attribute — without `aria-disabled` the state is not announced.
    expect(node.getAttribute("aria-disabled")).toBe("true");
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });

  it("carries the `data-slot=button` hook by default", () => {
    // A zone commitment on slot names (`PROBEWEB-12`, item 7) that the anatomy move does not
    // lift: dropping the name is a major version and an architect's call, not a side effect of a
    // kit fix.
    const host = mount(() => <Button>OK</Button>);

    expect(one(host, "button").getAttribute("data-slot")).toBe("button");
  });

  it("a loading state is assembled from what already exists, no prop sugar", () => {
    // Checks exactly what the component's docs promise: assembling `disabled` + `aria-busy` +
    // a nested indicator gives the same result a `loading` prop used to in the prior design.
    const host = mount(() => (
      <Button disabled aria-busy="true">
        <span data-testid="indicator" />
      </Button>
    ));
    const node = one<HTMLButtonElement>(host, "button");

    expect(node.disabled).toBe(true);
    expect(node.getAttribute("aria-busy")).toBe("true");
    expect(node.querySelector('[data-testid="indicator"]')).not.toBeNull();
  });
});

describe("passport: part ↔ markup", () => {
  it("every anatomy part appears in the document — with its own attributes", () => {
    const host = mount(scene);

    expect(anatomy.keys().length).toBeGreaterThan(0);

    for (const part of anatomy.keys()) {
      const { attrs } = parts[part];
      const node = one(
        host,
        `[data-scope="${attrs["data-scope"]}"][data-part="${attrs["data-part"]}"]`,
      );

      // Exactly the `attrs` from the anatomy, not merely similar attributes: the skin hooks in
      // with a selector from that same declaration, and they must match character-for-character.
      for (const [name, value] of Object.entries(attrs)) {
        expect(node.getAttribute(name)).toBe(value);
      }
    }
  });

  it("every address attribute found in markup is declared in the anatomy", () => {
    const host = mount(scene);
    const found = addressesInDocument(host);
    const declared = anatomy.keys().map((part) => parts[part].attrs);

    // The reverse side: a node carrying an address that is not in the anatomy is invisible to
    // the skin — it would stay bare even on a fully "dressed" component.
    expect(found.length).toBe(declared.length);

    for (const address of found) {
      expect(declared).toContainEqual({
        "data-scope": address.scope,
        "data-part": address.part,
      });
    }
  });

  it("the part's selector finds the node — otherwise the skin rule is dead", () => {
    const host = mount(scene);

    for (const part of anatomy.keys()) {
      // The anatomy's `selector` is written for nesting (`&[…], & […]`) — take the half that
      // addresses the node itself. An unparsable selector would make `matches` throw.
      const own = parts[part].selector.split(",")[0].replace("&", "").trim();

      expect(() => one(host, own)).not.toThrow();
    }
  });
});

describe("passport: states", () => {
  const states = passport.parts.flatMap((part) =>
    part.states.map((state) => ({ part: part.name, ...state })),
  );

  it("the vocabulary is not empty — otherwise the skin has nothing to dress but rest", () => {
    expect(states.length).toBeGreaterThan(0);
  });

  it.each(states.filter((state) => state.mark.kind === "pseudo"))(
    "`$name` is a real pseudo-class, not just a word",
    (state) => {
      const name = state.mark.kind === "pseudo" ? state.mark.name : "";
      const host = mount(scene);
      const node = one(host, `[data-part="${parts[state.part].attrs["data-part"]}"]`);

      // A pseudo-ELEMENT is not a state: `::before` draws a NODE that does not exist in markup,
      // and addressing it as a state would promise something that is not there.
      expect(name.startsWith(":")).toBe(true);
      expect(name.startsWith("::")).toBe(false);

      // A made-up pseudo-class breaks selector parsing — exactly what is needed here: the skin
      // generates a selector from the address, and an unparsable selector becomes a dead rule.
      expect(() => node.matches(name)).not.toThrow();
    },
  );

  /** The declared markup of a state — what the skin hooks onto. */
  function markOf(name: string): { name: string; value?: string } {
    const state = states.find((entry) => entry.name === name);
    if (!state || state.mark.kind !== "attribute") {
      throw new Error(`state ${name} is not declared as an attribute — the test is looking in the wrong place`);
    }

    return { name: state.mark.name, value: state.mark.value };
  }

  it("`disabled` — the button shows it itself, with the declared attribute", () => {
    const mark = markOf("disabled");
    const host = mount(() => <Button disabled>Cannot</Button>);

    expect(one(host, "button").hasAttribute(mark.name)).toBe(true);

    // And the reverse: a regular button must not have the attribute — otherwise "disabled"
    // would always be true, and the skin would gray out a live button.
    const idle = mount(() => <Button>Can</Button>);

    expect(one(idle, "button").hasAttribute(mark.name)).toBe(false);
  });

  it("`busy` — the consumer sets the attribute, and it arrives as declared", () => {
    // No `loading` prop sugar exists in the kit on purpose: a busy button is assembled from what
    // already exists. That is why the passport names WHAT the state is expressed by — otherwise
    // there is nowhere to agree on that, and the skin could not dress a busy button at all.
    const mark = markOf("busy");
    const host = mount(() => (
      <Button disabled {...{ [mark.name]: mark.value }}>
        Sending
      </Button>
    ));

    expect(one(host, "button").getAttribute(mark.name)).toBe(mark.value);
  });

  it("`expanded` — arrives from a popover on composition, with the declared attribute", () => {
    // The state does not belong to the button: expansion is the popover's behavior. But the LOOK
    // must show it — on a node that looks like a button — so the button's passport names it
    // (`PWEB-25`). The test goes through a live composition: declaring a state nobody sets is easy.
    const mark = markOf("expanded");
    const host = mount(() => (
      <Popover open>
        <PopoverTrigger as={Button}>Settings</PopoverTrigger>
      </Popover>
    ));

    expect(one(host, "button").hasAttribute(mark.name)).toBe(true);

    // And the reverse: a button that controls nothing has no such state — otherwise the skin
    // would paint every button as expanded.
    const idle = mount(scene);

    expect(one(idle, "button").hasAttribute(mark.name)).toBe(false);
  });

  it("`pressed` — arrives from a toggle, the look stays the button's own", () => {
    const mark = markOf("pressed");
    const host = mount(() => (
      <Toggle as={Button} pressed>
        Bold
      </Toggle>
    ));

    expect(one(host, "button").hasAttribute(mark.name)).toBe(true);

    const idle = mount(scene);

    expect(one(idle, "button").hasAttribute(mark.name)).toBe(false);
  });
});

describe("passport: variant axis", () => {
  it("the axis is expressed by ONE attribute and names no values", () => {
    const { mark } = passport.variantAxis;

    expect(mark.kind).toBe("attribute");
    // The axis deliberately has no value: the value is the variant's NAME, and names are created
    // by a human in the editor together with a skin. Should the kit declare even one, the
    // passport would declare something unobservable.
    expect(mark.kind === "attribute" && mark.value).toBeUndefined();
  });

  it("a name the kit does not know still reaches the node", () => {
    const { mark } = passport.variantAxis;
    // The name is deliberately arbitrary and human: the kit must know NONE of the variant names,
    // and what is being checked here is the kit's transparency, not that a variant exists.
    const host = mount(() => <Button {...{ [mark.name]: "primary" }}>Save</Button>);

    expect(one(host, "button").getAttribute(mark.name)).toBe("primary");
  });

  it("a bare button carries no axis attribute — the default is named by the skin, not the kit", () => {
    const host = mount(scene);

    expect(one(host, "button").hasAttribute(passport.variantAxis.mark.name)).toBe(false);
  });
});

describe("passport: what is allowed inside", () => {
  // A button admits a label and an icon inside — recorded by GENUS, not by component names
  // (`PWEB-24`). The test guards both sides: what is declared really reaches a live node, and
  // what is not declared is rejected by the machine.
  //
  // An honest limit: the EDITOR rejects, not the DOM. You can put anything inside a `<button>`,
  // and a rejection cannot be checked on the node in principle — the nesting rule is a promise
  // made to whoever assembles the tree. That is why this asks `admits`, not the markup.
  const root = editorInfo.parts[passport.root];

  if (!root) throw new Error("the button has no editor info on its root part");

  it("declares text and an icon admissible — and nothing beyond that", () => {
    expect(admits(root, { kind: "content", genus: "text" })).toBe(true);
    expect(admits(root, { kind: "content", genus: "icon" })).toBe(true);
  });

  it("rejects a component — there is no room for layout inside a button", () => {
    // The candidate's genus is taken from ITS OWN passport. Here that is the button's own
    // passport: a button inside a button is exactly the nesting that must be rejected, and no
    // second component is needed to check it.
    expect(admits(root, { kind: "content", genus: editorInfo.genus })).toBe(false);
  });

  it("what is declared reaches a live node: label and icon are visible inside the button", () => {
    const host = mount(() => (
      <Button>
        <svg data-sample="icon" />
        Save
      </Button>
    ));
    const node = one(host, "button");

    expect(node.textContent).toBe("Save");
    expect(node.querySelector("[data-sample='icon']")).not.toBeNull();
  });

  it("the component's genus is declared — otherwise a candidate would be recognized by package name", () => {
    expect(editorInfo.genus).toBe("component");
  });
});

describe("passport: shape", () => {
  const declared = passport.parts.map((part) => part.name);

  it("editor info covers EXACTLY the anatomy's parts — no more, no less", () => {
    // An anatomy part without editor info has neither states nor a meaning: the editor has
    // nothing to show. Editor info without an anatomy part addresses something absent from markup.
    expect([...declared].sort()).toEqual([...anatomy.keys()].sort());
  });

  it("the root is named and is among the parts", () => {
    expect(anatomy.keys()).toContain(passport.root);
  });

  it("the component name is taken from the anatomy, not written alongside it", () => {
    expect(passport.component).toBe(parts[passport.root].attrs["data-scope"]);
  });

  it("the nesting rule references parts that exist", () => {
    for (const part of Object.values(editorInfo.parts)) {
      for (const allowed of part.accepts ?? []) {
        if (allowed.kind === "part") expect(declared).toContain(allowed.name);
      }
    }
  });

  it("state names within a part are not repeated", () => {
    // A repeat breaks addressing silently: a skin rule hooks onto a name, and which of the two
    // states was meant becomes unknowable.
    for (const part of passport.parts) {
      const names = part.states.map((state) => state.name);

      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("the group is declared and taken from the closed list", () => {
    // The place in the list is named by the PROVIDER (`PWEB-34`): if the button did not name it,
    // every editor host would invent its own section, and the editor and catalog would drift
    // apart on the very first dozen components.
    expect(editorInfo.group).toBe("actions");
    expect(Object.keys(GROUPS)).toContain(editorInfo.group);
    expect(groupOf(editorInfo)).toBe("actions");
  });

  it("the provider is named and matches the manifest", () => {
    // The form is shared across every provider, so a reader must learn the provider from DATA,
    // without knowing package names ahead of time. The string is written into the passport by
    // hand — checked against the manifest, otherwise it would drift from it silently.
    expect(editorInfo.package).toBe(manifest.name);
  });
});

// PROOF RECIPE (`PWEB-111`, `button.recipe.ts`): the component proves itself — the button's
// passport CAN be dressed whole by the real skin mechanism, not merely assembled by types. This
// used to be proven by a separate package, `packages/skin-reference` (removed, `PWEB-110`).
describe("proof recipe: the passport CAN be dressed whole", () => {
  const outfit: Outfit = { name: "sample", palette: palette.name, forms: [form.name] };
  // `assemble` throws `OutfitRefused` on a defect — it did not throw, so the outfit assembled
  // HONESTLY, not merely without hitting a check.
  const { skin } = assemble(outfit, { palettes: [palette], forms: [form] });

  it("coverage is complete — not one uncovered passport coordinate", () => {
    expect(skinGaps(skin, [passport])).toEqual([]);
  });

  it("CSS is actually generated, not merely type-checked", () => {
    expect(generateSkinCss(skin).length).toBeGreaterThan(0);
  });
});
