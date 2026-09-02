import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as fileUploadKit } from "../components/index.js";
import { passport as fileUploadPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as fileUploadEditorInfo } from "../playground/index.js";

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
    "file-upload": { passport: readable(fileUploadPassport, fileUploadEditorInfo), parts: fileUploadKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('file-upload "basic" — one accepted file, one rejected, from data', () => {
  it("shows the label from data and both item rows with the right data-type", () => {
    const data = { label: "Файлы" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(fileUploadPassport, assembly as PassportAssembly, "file-upload", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const label = host.querySelector('[data-scope="file-upload"][data-part="label"]');
    expect(label?.textContent).toBe("Файлы");

    const items = host.querySelectorAll('[data-scope="file-upload"][data-part="item"]');
    expect(items).toHaveLength(2);
    expect(items[0]?.getAttribute("data-type")).toBe("accepted");
    expect(items[1]?.getAttribute("data-type")).toBe("rejected");

    const names = host.querySelectorAll('[data-scope="file-upload"][data-part="item-name"]');
    expect(names[0]?.textContent).toBe("resume.pdf");
    expect(names[1]?.textContent).toBe("video.mp4");

    const deleteTriggers = host.querySelectorAll('[data-scope="file-upload"][data-part="item-delete-trigger"]');
    expect(deleteTriggers).toHaveLength(2);

    const hiddenInput = host.querySelector('input[type="file"]');
    expect(hiddenInput).not.toBeNull();
  });
});
