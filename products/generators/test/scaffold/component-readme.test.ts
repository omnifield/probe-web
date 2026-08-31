import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { fromEntryTemplate } from "../../src/barrel/template.js";
import type { Entry } from "../../src/barrel/types.js";
import { generateScaffoldFiles } from "../../src/scaffold/generate.js";
import type { ScaffoldSpec } from "../../src/scaffold/types.js";
import { importModule } from "../../src/extract/module.js";

// Proof-of-concept for GEN-5 (variant C, chosen by user): renders a component
// README from the REAL passport of the copied accordion fixture, not
// synthetic data. This is deliberately NOT under `src/` — the shape below
// (part/state/mark, setting/mark/default) is UI-kit domain knowledge, the
// same kind of thing `packages/ui/scripts/generate.mjs` owns for barrels;
// this engine only provides scan/collect/render/write, never what a
// component's README should contain.

interface Mark {
  readonly kind: "attribute" | "pseudo";
  readonly name: string;
  readonly value?: string;
}

interface PassportState {
  readonly name: string;
  readonly mark?: Mark;
  readonly absentWhen?: unknown;
}

interface PassportPart {
  readonly name: string;
  readonly states?: readonly PassportState[];
}

interface PassportSetting {
  readonly mark?: Mark;
  readonly byDefault?: unknown;
  readonly dependsOn?: { readonly on: string };
}

interface PassportModule {
  readonly passport: {
    readonly parts: readonly PassportPart[];
    readonly settings: Readonly<Record<string, PassportSetting>>;
  };
}

function formatMark(mark: Mark | undefined): string {
  if (!mark) return "—";
  if (mark.kind === "pseudo") return mark.name;
  return mark.value === undefined ? `[${mark.name}]` : `[${mark.name}="${mark.value}"]`;
}

function formatDefault(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

interface AnatomyRow {
  readonly part: string;
  readonly state: string;
  readonly mark: string;
}

interface SettingRow {
  readonly setting: string;
  readonly mark: string;
  readonly default: string;
  readonly dependsOn?: string;
}

interface ReadmeItem {
  readonly title: string;
  readonly anatomyRows: readonly AnatomyRow[];
  readonly settingRows: readonly SettingRow[];
}

async function collectReadmeItem(entry: Entry): Promise<ReadmeItem> {
  const { passport } = await importModule<PassportModule>(join(entry.path, "entity", "passport.ts"));

  const anatomyRows: AnatomyRow[] = passport.parts.flatMap((part) => {
    if (!part.states || part.states.length === 0) {
      return [{ part: part.name, state: "—", mark: "—" }];
    }
    return part.states.map((state) => ({
      part: part.name,
      state: state.name,
      mark: formatMark(state.mark) + (state.absentWhen ? " · may be absent" : ""),
    }));
  });

  const settingRows: SettingRow[] = Object.entries(passport.settings).map(([name, setting]) => ({
    setting: name,
    mark: formatMark(setting.mark),
    default: formatDefault(setting.byDefault),
    dependsOn: setting.dependsOn?.on,
  }));

  const title = entry.name
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");

  return { title, anatomyRows, settingRows };
}

describe("component README (variant C) against the real accordion fixture", () => {
  it("renders anatomy/settings tables from the real, executed passport", async () => {
    const entry: Entry = {
      name: "accordion",
      path: join(import.meta.dirname, "..", "fixtures", "accordion"),
    };

    const spec: ScaffoldSpec<ReadmeItem> = {
      outputPathFor: () => "unused-in-this-test.md",
      collect: collectReadmeItem,
      render: fromEntryTemplate(join(import.meta.dirname, "templates", "component-readme.md.hbs")),
    };

    const [file] = await generateScaffoldFiles([entry], spec);

    expect(file?.content).toContain("# Accordion");
    expect(file?.content).toContain("| itemTrigger | disabled | :disabled |");
    expect(file?.content).toContain('| itemContent | open | [data-state="open"] · may be absent |');
    expect(file?.content).toContain("| collapsible | — | `false` (depends on `multiple`) |");

    // Surfaced for review, not asserted line-by-line: the whole point of this
    // test is to show a human the actual rendered output before it goes
    // anywhere near a real component.
    console.log(file?.content);
  });
});
