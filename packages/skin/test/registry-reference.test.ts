// Опечатка в ЧУЖОМ имени реестра ловится компилятором, если во второй тип-параметр подставлена
// литеральная уния. `expectTypeOf`/`@ts-expect-error` проверяет `tsc`; рантайм-тело — no-op.

import { describe, expectTypeOf, it } from "vitest";

import type { PassportAdmission, PassportAssemblyElement } from "../src/engine/passport/assembly/index.js";

type OwnPart = "root" | "trigger";
// Stands in for the literal union `packages/ui`'s generated barrel will hand out — a closed list
// of every component name in the shared registry.
type KitComponentName = "accordion" | "button";

describe("node/accepts[].name против подставленной унии реестра", () => {
  it("node accepts an own part OR a real registry name", () => {
    const ownPart: PassportAssemblyElement<OwnPart, KitComponentName> = { node: "trigger" };
    const foreignRef: PassportAssemblyElement<OwnPart, KitComponentName> = { node: "button" };

    expectTypeOf(ownPart.node).toEqualTypeOf<OwnPart | KitComponentName>();
    expectTypeOf(foreignRef.node).toEqualTypeOf<OwnPart | KitComponentName>();

    // @ts-expect-error — "buttn" is neither an own part nor a registered component: a typo.
    const typo: PassportAssemblyElement<OwnPart, KitComponentName> = { node: "buttn" };
    void typo;
  });

  it("accepts[].name is checked the same way", () => {
    const rule: PassportAdmission<OwnPart, KitComponentName> = { kind: "component", name: "button" };
    expectTypeOf(rule).toMatchTypeOf<PassportAdmission<OwnPart, KitComponentName>>();

    // @ts-expect-error — "accordian" was never a registered component name.
    const typo: PassportAdmission<OwnPart, KitComponentName> = { kind: "component", name: "accordian" };
    void typo;
  });

  it("the default (no second type argument) stays permissive — every existing kit call keeps compiling", () => {
    const anyString: PassportAssemblyElement = { node: "whatever-a-caller-that-never-plugged-in-a-registry-writes" };
    expectTypeOf(anyString.node).toEqualTypeOf<string>();
  });
});
