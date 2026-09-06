import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { For } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as tocKit, Toc, TocItem, TocLink, TocList } from "../components/index.js";
import { passport as tocPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as tocEditorInfo } from "../playground/index.js";

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
    toc: { passport: readable(tocPassport, tocEditorInfo), parts: tocKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const items = [
  { value: "intro", depth: 2, label: "Введение", href: "#intro" },
  { value: "install", depth: 2, label: "Установка", href: "#install" },
  { value: "config", depth: 3, label: "Настройка", href: "#config" },
];

describe('toc "basic" — links from data, content stays an empty slot for the consumer', () => {
  it("shows every link's label and href, and the real depth from data on each item", () => {
    const data = { items };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tocPassport, assembly as PassportAssembly, "toc", data);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const links = [...host.querySelectorAll('[data-scope="toc"][data-part="link"]')] as HTMLAnchorElement[];
    expect(links.map((link) => link.textContent)).toEqual(["Введение", "Установка", "Настройка"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["#intro", "#install", "#config"]);

    const rows = [...host.querySelectorAll('[data-scope="toc"][data-part="item"]')];
    expect(rows.map((row) => row.getAttribute("data-depth"))).toEqual(["2", "2", "3"]);
  });

  it("addresses the kit-invented content/nav parts, and leaves content empty for the consumer to fill", () => {
    const data = { items };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tocPassport, assembly as PassportAssembly, "toc", data);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const content = host.querySelector('[data-scope="toc"][data-part="content"]');
    const nav = host.querySelector('[data-scope="toc"][data-part="nav"]');
    expect(content).not.toBeNull();
    expect(content?.textContent).toBe("");
    expect(nav).not.toBeNull();
    expect(nav?.querySelector('[data-scope="toc"][data-part="title"]')?.textContent).toBe("На этой странице");
  });
});

describe("toc — active state reflects controlled activeIds, not just scroll (jsdom stubs IntersectionObserver)", () => {
  it("marks the matching item/link data-active, and no others", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <Toc items={items} activeIds={["install"]}>
          <TocList>
            <For each={items}>
              {(item) => (
                <TocItem item={item}>
                  <TocLink href={item.href}>{item.label}</TocLink>
                </TocItem>
              )}
            </For>
          </TocList>
        </Toc>
      ),
      host,
    );

    const active = [...host.querySelectorAll('[data-scope="toc"][data-part="link"]')].filter((link) =>
      link.hasAttribute("data-active"),
    );
    expect(active).toHaveLength(1);
    expect(active[0]!.textContent).toBe("Установка");
  });
});
