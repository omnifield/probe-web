
import { componentSelector, type PassportLookup } from "../address/index.js";
import { DARK_CLASS, LAYER_ORDER } from "../marks/index.js";
import { cssProperty } from "../property/index.js";
import type { Skin, StyleObject, StyleValue } from "../recipe/index.js";
import type { CssRule } from "../rules/index.js";
import { skinValues } from "../seeds/index.js";
import { sizeBlocks } from "../sizes/index.js";

export function declarations(style: StyleObject, indent: string): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;

    if (typeof value === "object") {
      lines.push(`${indent}${key} {`, ...declarations(value, `${indent}  `), `${indent}}`);
      continue;
    }

    lines.push(`${indent}${cssProperty(key)}: ${value as StyleValue};`);
  }

  return lines;
}

export function ruleText(rule: CssRule): string {
  return [`  ${rule.selector} {`, ...declarations(rule.style, "    "), "  }"].join("\n");
}

function valuesText(selector: string, values: readonly (readonly [string, string])[]): string {
  return [`  ${selector} {`, ...values.map(([name, value]) => `    --${name}: ${value};`), "  }"].join("\n");
}

const DARK_SELECTOR = `:root.${DARK_CLASS}, :root .${DARK_CLASS}`;

export function darkPairs(skin: Skin): (readonly [string, string])[] {
  const light = skinValues(skin, "light");

  return [...skinValues(skin, "dark")]
    .filter(([name, own]) => light.get(name)?.value !== own.value)
    .map(([name, own]): [string, string] => [name, own.value]);
}

export function variablesText(skin: Skin, dark: readonly (readonly [string, string])[], lookup: PassportLookup): string[] {
  const blocks: string[] = [];
  const light = skinValues(skin, "light");

  if (light.size > 0) {
    blocks.push(valuesText(":root", [...light].map(([name, own]) => [name, own.value])));
  }

  if (dark.length > 0) blocks.push(valuesText(DARK_SELECTOR, dark));

  blocks.push(...sizeBlocks(skin, "  "));
  blocks.push(...overrideBlocks(skin, lookup));

  return blocks;
}

function overrideBlocks(skin: Skin, lookup: PassportLookup): string[] {
  const blocks: string[] = [];

  for (const [component, edits] of Object.entries(skin.overrides ?? {})) {
    const passport = lookup(component);
    const selector = passport ? componentSelector(passport) : undefined;

    if (selector) blocks.push(valuesText(selector, Object.entries(edits)));
  }

  return blocks;
}

export function modeText(dark: readonly (readonly [string, string])[]): string[] {
  const blocks = [
    "/* WHICH HALF IS WORN — an answer to the browser, not styling: it drives scrollbars,\n" +
      "   unstyled form fields, and other browser UI. Nothing else on the page states the\n" +
      "   mode. OUTSIDE THE LAYER on purpose: a declaration outside any layer beats any\n" +
      "   declaration inside a layer, and inside the layer our answer would be silently\n" +
      "   overridden. */",
    ":root {\n  color-scheme: light;\n}",
  ];

  if (dark.length > 0) blocks.push(`${DARK_SELECTOR} {\n  color-scheme: dark;\n}`);

  return blocks;
}

export function keyframesText(skin: Skin): string[] {
  return Object.entries(skin.keyframes ?? {}).map(([name, frames]) =>
    [`  @keyframes ${name} {`, ...declarations(frames, "    "), "  }"].join("\n"),
  );
}

export function layered(header: string, layer: string, blocks: readonly string[], outside: readonly string[] = []): string {
  return [
    header,
    LAYER_ORDER,
    "",
    ...(outside.length > 0 ? [...outside, ""] : []),
    `@layer ${layer} {`,
    ...blocks,
    "}",
    "",
  ].join("\n");
}
