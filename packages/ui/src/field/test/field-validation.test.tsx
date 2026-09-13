import type { AssemblyTree } from "@web-core/assembly";
import { ValidationProvider } from "@web-core/form/solid";
import { z } from "@web-core/io";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Field, FieldErrorText } from "../components/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const schema = z.object({ email: z.string().email() });

function buildTree(): AssemblyTree {
  return {
    components: {
      root: "email",
      nodes: {
        email: { id: "email", type: "field", parentId: null, children: [], bind: { value: "/email" } },
      },
    },
  };
}

describe("Field × ось валидации — useKitLife реально доводит invalid до DOM", () => {
  it("невалидные данные в ValidationProvider ставят data-invalid на реальный узел Field", () => {
    const [data, setData] = createSignal<unknown>({ email: "not-an-email" });

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <ValidationProvider tree={buildTree()} schema={schema} data={data}>
          <Field data-node="email" />
        </ValidationProvider>
      ),
      host,
    );

    const root = host.querySelector('[data-scope="field"][data-part="root"]');
    expect(root?.getAttribute("data-invalid")).toBe("");

    setData({ email: "real@example.com" });
    expect(root?.getAttribute("data-invalid")).toBeNull();
  });

  it("без ValidationProvider в дереве — no-op, как у скина: invalid не проставляется сам по себе", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Field />, host);

    const root = host.querySelector('[data-scope="field"][data-part="root"]');
    expect(root?.getAttribute("data-invalid")).toBeNull();
  });

  it("FieldErrorText сам зовёт useKitLife и показывает сообщение issue, без ручной прокидки текста потребителем", () => {
    const [data, setData] = createSignal<unknown>({ email: "not-an-email" });

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <ValidationProvider tree={buildTree()} schema={schema} data={data}>
          <Field data-node="email">
            <FieldErrorText data-node="email" />
          </Field>
        </ValidationProvider>
      ),
      host,
    );

    expect(host.querySelector('[data-scope="field"][data-part="error-text"]')?.textContent).toBeTruthy();

    // Ark сам скрывает error-text целиком (`<Show when={field().invalid}>`, чужая механика, не
    // наша) — валидный `invalid` от Field-контекста убирает узел из DOM полностью, не просто текст.
    setData({ email: "real@example.com" });
    expect(host.querySelector('[data-scope="field"][data-part="error-text"]')).toBeNull();
  });

  it("FieldErrorText без своего data-node (не заведён отдельным узлом) — акцессор undefined, ничего не падает", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <ValidationProvider tree={buildTree()} schema={schema} data={() => ({ email: "not-an-email" })}>
          <Field data-node="email">
            <FieldErrorText>Своя строка от потребителя</FieldErrorText>
          </Field>
        </ValidationProvider>
      ),
      host,
    );

    expect(host.querySelector('[data-scope="field"][data-part="error-text"]')?.textContent).toBe(
      "Своя строка от потребителя",
    );
  });
});
