import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as typographyKit, Typography } from "../components/index.js";
import { passport as typographyPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as typographyEditorInfo } from "../playground/index.js";

function readable<Part extends string, Data = unknown>(
  passport: ComponentPassport<Part>,
  editorInfo: PassportEditorInfo<Part, string, Data>,
): ReadableComponent["passport"] {
  return {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    selfAssembly: passport.selfAssembly as any,
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    typography: {
      passport: readable(typographyPassport, typographyEditorInfo),
      parts: typographyKit.parts,
    },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('typography "basic" — shows the text data brings, nothing hardcoded in the assembly', () => {
  it("renders the root with its address and the text from data", () => {
    const data = { text: "Живой текст из данных" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(typographyPassport, assembly as PassportAssembly, "typography", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const root = host.querySelector('[data-scope="typography"][data-part="root"]');
    expect(root?.tagName).toBe("P");
    expect(root?.textContent).toBe("Живой текст из данных");
  });
});

describe("typography — the tag is the consumer's choice, independent of the visual variant", () => {
  it("renders a <p> by default and swaps to a real <h1> via `as`, keeping the address", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <>
          <Typography data-testid="default">Обычный текст</Typography>
          <Typography as="h1" data-variant="heading" data-testid="heading">
            Заголовок
          </Typography>
        </>
      ),
      host,
    );

    const paragraph = host.querySelector('[data-testid="default"]');
    expect(paragraph?.tagName).toBe("P");

    const heading = host.querySelector('[data-testid="heading"]');
    expect(heading?.tagName).toBe("H1");
    expect(heading?.getAttribute("data-scope")).toBe("typography");
    expect(heading?.getAttribute("data-variant")).toBe("heading");
  });
});
