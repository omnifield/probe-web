
import {
  admits,
  isAssemblyContent,
  isAssemblyRepeat,
  type PassportAdmission,
  type PassportAssembly,
  type PassportAssemblyContent,
  type PassportAssemblyElement,
  type PassportAssemblyNode,
} from "../engine/passport/assembly/index.js";
import type { ComponentPassport } from "../engine/passport/form/index.js";
import type { PassportPartEditorInfo } from "./types.js";

// `Data` — accepted here purely so the CALL BOUNDARY from `../editor/define.ts`'s `defineEditorInfo`
// never needs to widen a real-schema `PassportAssembly` into this function's own parameter (the
// widening `../assembly/README.md#paths` documents as broken for exactly this class of type).
// Nothing BELOW that boundary reads `Data` at all: this traversal only ever asks about `node`/
// `children`/`recur`/`repeat`/`genus` — never `bind`/`props`/`on`, the only fields `Data`
// touches — so `tree` is re-typed to the permissive default ONCE, right after entry, and every
// helper below works with that shape for the rest of the function.
export function checkAssembly<Part extends string, Registry extends string = string, Data = unknown>(
  component: string,
  passport: ComponentPassport<Part>,
  parts: Readonly<Record<Part, PassportPartEditorInfo<Part, Registry>>>,
  assembly: PassportAssembly<Part, Registry, Data>,
): void {
  const declared = passport.anatomy.keys();

  if (assembly.name.trim() === "") {
    throw new Error(`assembly "${component}" (${assembly.means}) has no name — cannot be addressed by list position`);
  }

  if (assembly.tree.node !== passport.root) {
    throw new Error(
      `assembly "${component}.${assembly.name}" starts at node "${assembly.tree.node}", but the ` +
        `component's root is "${passport.root}"`,
    );
  }

  // A plain `as` (not `as unknown as`) — the two shapes genuinely overlap structurally (a real
  // `Data`'s `bind` values are a literal string subset of the default's plain `string`), it is only
  // TypeScript's assignability fast path for this class of type that can't see it; the assertion
  // check (`isTypeComparableTo`) falls back to a structural comparison where assignability gives up.
  const tree = assembly.tree as PassportAssemblyElement<Part, Registry>;

  const declaredNames: readonly string[] = declared;
  const isOwnPart = (node: { readonly node: string }): boolean => declaredNames.includes(node.node);

  const templateOf = (
    node: PassportAssemblyNode<Part, Registry>,
  ): PassportAssemblyElement<Part, Registry> | PassportAssemblyContent => {
    if (isAssemblyRepeat(node)) return templateOf(node.template);

    return node;
  };

  const walk = (node: PassportAssemblyElement<Part, Registry>): void => {
    const owner = isOwnPart(node) ? parts[node.node as Part] : undefined;

    for (const declaredChild of node.children ?? []) {
      const child = templateOf(declaredChild);
      const candidate: PassportAdmission = isAssemblyContent(child)
        ? { kind: "content", genus: child.genus }
        : { kind: "component", name: child.node };

      if (owner && !admits(owner, candidate)) {
        const what = isAssemblyContent(child)
          ? `content of genus "${child.genus}"`
          : isOwnPart(child)
            ? `part "${child.node}"`
            : `registry reference "${child.node}"`;
        const into = isOwnPart(node) ? `part "${node.node}"` : `reference "${node.node}"`;

        throw new Error(`assembly "${component}.${assembly.name}" puts ${what} inside ${into}, which does not admit it`);
      }

      if (!isAssemblyContent(child) && isOwnPart(child)) walk(child);
    }

    // `recur` attaches this SAME node's own kind into one of its declared children, without
    // naming that child as an ordinary declared node — the nesting rule still applies, just
    // against the part named `into` rather than against something written out in `children`.
    if (node.recur) {
      const target = (node.children ?? [])
        .map((declaredChild) => templateOf(declaredChild))
        .find((declaredChild) => !isAssemblyContent(declaredChild) && declaredChild.node === node.recur!.into);

      if (!target || isAssemblyContent(target)) {
        throw new Error(
          `assembly "${component}.${assembly.name}" recurs "${node.node}" into "${node.recur.into}", but "${node.recur.into}" is not a declared child of "${node.node}"`,
        );
      }

      const owner = isOwnPart(target) ? parts[target.node as Part] : undefined;
      const candidate: PassportAdmission = { kind: "component", name: node.node };

      if (owner && !admits(owner, candidate)) {
        throw new Error(
          `assembly "${component}.${assembly.name}" recurs part "${node.node}" into part "${node.recur.into}", which does not admit it`,
        );
      }
    }
  };

  walk(tree);
}
