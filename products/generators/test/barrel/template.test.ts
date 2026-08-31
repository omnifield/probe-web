import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { fromEntryTemplate, fromTemplate } from "../../src/barrel/template.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "probe-web-generators-template-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeTemplate(name: string, source: string): string {
  const path = join(dir, name);
  writeFileSync(path, source, "utf8");
  return path;
}

describe("fromTemplate", () => {
  it("renders a loop over items with plain interpolation", () => {
    const templatePath = writeTemplate(
      "list.hbs",
      "{{#each items}}export * from \"./{{name}}/index.js\";\n{{/each}}",
    );

    const render = fromTemplate<{ name: string }>(templatePath);

    expect(render([{ name: "accordion" }, { name: "button" }])).toBe(
      'export * from "./accordion/index.js";\n' + 'export * from "./button/index.js";\n',
    );
  });

  it("does not HTML-escape interpolated values", () => {
    const templatePath = writeTemplate("quotes.hbs", '{{#each items}}import "{{module}}";\n{{/each}}');

    const render = fromTemplate<{ module: string }>(templatePath);

    expect(render([{ module: "./a&b.js" }])).toBe('import "./a&b.js";\n');
  });

  it("throws on a field name that does not exist on the item, instead of rendering blank", () => {
    const templatePath = writeTemplate("typo.hbs", "{{#each items}}{{nmae}}{{/each}}");

    const render = fromTemplate<{ name: string }>(templatePath);

    expect(() => render([{ name: "accordion" }])).toThrow();
  });

  it("compiles once and can render different item lists on repeated calls", () => {
    const templatePath = writeTemplate("count.hbs", "{{items.length}}");

    const render = fromTemplate<{ name: string }>(templatePath);

    expect(render([{ name: "a" }])).toBe("1");
    expect(render([{ name: "a" }, { name: "b" }])).toBe("2");
  });
});

describe("fromEntryTemplate", () => {
  it("renders one item's fields directly, with no { items } wrapper", () => {
    const templatePath = writeTemplate("entry.hbs", "# {{title}}\n\n{{#each parts}}- {{this}}\n{{/each}}");

    const render = fromEntryTemplate<{ title: string; parts: string[] }>(templatePath);

    expect(render({ title: "Accordion", parts: ["root", "item"] })).toBe("# Accordion\n\n- root\n- item\n");
  });
});
