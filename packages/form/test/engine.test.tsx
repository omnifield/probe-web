import { describe, expect, it } from "vitest";
import { z } from "@web-core/io";
import type { AssemblyTree } from "@web-core/assembly";

import { evaluateRule, growValidatorLayer } from "../src/engine/index.js";

const registrationSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.confirm !== data.password) {
      ctx.addIssue({ code: "custom", path: ["confirm"], message: "не совпадает" });
    }
  });

function treeOf(nodes: AssemblyTree["components"]["nodes"]): AssemblyTree {
  return { components: { root: "form", nodes } };
}

describe("growValidatorLayer", () => {
  it("забинженный невалидный путь получает issue", () => {
    const tree = treeOf({
      form: { id: "form", type: "form", parentId: null, children: ["email"] },
      email: { id: "email", type: "field", parentId: "form", children: [], bind: { value: "/email" } },
    });

    const byPath = growValidatorLayer(tree, registrationSchema, {
      email: "not-an-email",
      password: "longenough",
      confirm: "longenough",
    });

    expect(byPath["/email"]).toBeDefined();
    expect(byPath["/email"]?.length).toBeGreaterThan(0);
  });

  it("валидные данные — путь без issues вообще", () => {
    const tree = treeOf({
      form: { id: "form", type: "form", parentId: null, children: ["email"] },
      email: { id: "email", type: "field", parentId: "form", children: [], bind: { value: "/email" } },
    });

    const byPath = growValidatorLayer(tree, registrationSchema, {
      email: "real@example.com",
      password: "longenough",
      confirm: "longenough",
    });

    expect(byPath["/email"]).toBeUndefined();
  });

  it("межполевой superRefine приписывает issue пути confirm, не password", () => {
    const tree = treeOf({
      form: { id: "form", type: "form", parentId: null, children: ["password", "confirm"] },
      password: { id: "password", type: "field", parentId: "form", children: [], bind: { value: "/password" } },
      confirm: { id: "confirm", type: "field", parentId: "form", children: [], bind: { value: "/confirm" } },
    });

    const byPath = growValidatorLayer(tree, registrationSchema, {
      email: "real@example.com",
      password: "longenough",
      confirm: "different",
    });

    expect(byPath["/confirm"]?.length).toBeGreaterThan(0);
    expect(byPath["/password"]).toBeUndefined();
  });

  it("путь, не забинженный в этой сборке, отсекается — даже если схема его знает", () => {
    const tree = treeOf({
      form: { id: "form", type: "form", parentId: null, children: ["password"] },
      password: { id: "password", type: "field", parentId: "form", children: [], bind: { value: "/password" } },
    });

    const byPath = growValidatorLayer(tree, registrationSchema, {
      email: "not-an-email",
      password: "longenough",
      confirm: "longenough",
    });

    expect(byPath["/email"]).toBeUndefined();
  });
});

describe("evaluateRule", () => {
  it("HIDE — совпало условие, узел скрыт", () => {
    const effect = evaluateRule(
      { effect: "HIDE", vars: { subscribed: "/subscribeNewsletter" }, when: { "==": [{ var: "subscribed" }, false] } },
      { subscribeNewsletter: false },
    );

    expect(effect.hidden).toBe(true);
  });

  it("SHOW — совпало условие, значит НЕ скрыт", () => {
    const effect = evaluateRule(
      { effect: "SHOW", vars: { subscribed: "/subscribeNewsletter" }, when: { "==": [{ var: "subscribed" }, true] } },
      { subscribeNewsletter: true },
    );

    expect(effect.hidden).toBe(false);
  });

  it("DISABLE — узел задизейблен, hidden не участвует", () => {
    const effect = evaluateRule(
      { effect: "DISABLE", vars: { agree: "/agree" }, when: { "==": [{ var: "agree" }, false] } },
      { agree: false },
    );

    expect(effect.disabled).toBe(true);
    expect(effect.hidden).toBeUndefined();
  });
});
