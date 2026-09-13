import type { AssemblyTree } from "@web-core/assembly";
import { ValidationProvider } from "@web-core/form/solid";
import { z } from "@web-core/io";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { passport as fieldPassport } from "../src/field/entity/passport.js";
import { useKitLife } from "../src/shared/utils/skin-life.js";

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

function Probe(props: { "data-node": string }) {
  const validation = useKitLife(fieldPassport, props);
  return <span data-testid="probe">{validation()?.invalid ? "invalid" : "ok"}</span>;
}

describe("useKitLife — третий вызов, валидация", () => {
  it("без ValidationProvider в дереве возвращает акцессор на undefined (тот же no-op, что у скина)", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Probe data-node="email" />, host);

    expect(host.textContent).toBe("ok");
  });

  it("с ValidationProvider отдаёт реальные issues по пути узла — тот же useComponentValidation, сложенный внутрь useKitLife", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <ValidationProvider tree={buildTree()} schema={schema} data={() => ({ email: "not-an-email" })}>
          <Probe data-node="email" />
        </ValidationProvider>
      ),
      host,
    );

    expect(host.textContent).toBe("invalid");
  });
});
