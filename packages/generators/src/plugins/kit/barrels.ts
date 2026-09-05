import { join } from "node:path";

import { fromTemplate, identifierFromEntryName } from "../../engine/index.js";
import type { AggregatePlugin, EntryContext } from "../../engine/index.js";

export interface KitBarrelOptions {
  readonly outputDir: string;
  readonly templatesDir: string;
}

type KitFile = "kit.tsx" | "kit.ts" | "index.tsx" | "index.ts";

function kitFileOf(entry: EntryContext): KitFile | undefined {
  if (entry.has("components/kit.tsx")) return "kit.tsx";
  if (entry.has("components/kit.ts")) return "kit.ts";
  if (entry.has("components/index.tsx")) return "index.tsx";
  if (entry.has("components/index.ts")) return "index.ts";
  return undefined;
}

interface PassportItem {
  readonly passportIdentifier: string;
  readonly editorInfoIdentifier: string;
  readonly passportModule: string;
  readonly editorInfoModule: string;
}

function passportPlugin(options: KitBarrelOptions): AggregatePlugin<PassportItem> {
  return {
    name: "kit:passport",
    output: join(options.outputDir, "passport.ts"),
    collect: (entries) =>
      entries.map((entry) => ({
        passportIdentifier: identifierFromEntryName(entry.name, "Passport"),
        editorInfoIdentifier: identifierFromEntryName(entry.name, "EditorInfo"),
        passportModule: `${entry.name}/entity/passport.js`,
        editorInfoModule: `${entry.name}/playground/index.js`,
      })),
    validate: (items) => {
      if (items.length === 0) throw new Error("в `src/` нет ни одной папки компонента с анатомией — подпуть паспорта пуст");
    },
    render: fromTemplate(join(options.templatesDir, "passport.ts.hbs")),
  };
}

interface KitItem {
  readonly name: string;
  readonly kitFile: KitFile | undefined;
  readonly kitIdentifier: string;
  readonly kitModule: string | undefined;
}

function kitPlugin(options: KitBarrelOptions): AggregatePlugin<KitItem> {
  return {
    name: "kit:kit",
    output: join(options.outputDir, "kit.ts"),
    collect: (entries) =>
      entries.map((entry) => {
        const kitFile = kitFileOf(entry);
        const kitModule =
          kitFile && `${entry.name}/components/${kitFile.replace(/\.tsx$/, ".jsx").replace(/\.ts$/, ".js")}`;
        return {
          name: entry.name,
          kitFile,
          kitIdentifier: identifierFromEntryName(entry.name, "Kit"),
          kitModule,
        };
      }),
    validate: (items) => {
      const withoutMap = items.filter((item) => item.kitFile === undefined).map((item) => item.name);
      if (withoutMap.length > 0) throw new Error(`паспорт есть, карты нет — папки без карты частей: ${withoutMap.join(", ")}`);
    },
    render: fromTemplate(join(options.templatesDir, "kit.ts.hbs")),
  };
}

interface IoItem {
  readonly passportIdentifier: string;
  readonly ioIdentifier: string;
  readonly passportModule: string;
  readonly ioModule: string;
}

function ioPlugin(options: KitBarrelOptions): AggregatePlugin<IoItem> {
  return {
    name: "kit:io",
    output: join(options.outputDir, "io.ts"),
    isEntry: (entry) => entry.has("entity/io.ts"),
    collect: (entries) =>
      entries.map((entry) => ({
        passportIdentifier: identifierFromEntryName(entry.name, "Passport"),
        ioIdentifier: identifierFromEntryName(entry.name, "Io"),
        passportModule: `${entry.name}/entity/passport.js`,
        ioModule: `${entry.name}/entity/io.js`,
      })),
    render: fromTemplate(join(options.templatesDir, "io.ts.hbs")),
  };
}

function indexPlugin(options: KitBarrelOptions): AggregatePlugin<{ name: string }> {
  return {
    name: "kit:index",
    output: join(options.outputDir, "index.ts"),
    collect: (entries) => entries.map((entry) => ({ name: entry.name })),
    render: fromTemplate(join(options.templatesDir, "index.ts.hbs")),
  };
}

export function kitBarrelPlugins(options: KitBarrelOptions): readonly AggregatePlugin[] {
  return [passportPlugin(options), kitPlugin(options), ioPlugin(options), indexPlugin(options)];
}
