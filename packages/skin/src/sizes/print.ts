// Design notes: ./README.md#print

import { ROUND_SUPPORT_TEST } from "@web-core/style";
import type { Skin } from "../recipe/index.js";
import { declaredScales } from "./scales.js";
import { snappedValue, sizeValues } from "./value.js";

export function sizeBlocks(skin: Skin, indent: string): string[] {
  const values = sizeValues(skin);
  if (values.size === 0) return [];

  const blocks: string[] = [
    [`${indent}:root {`, ...[...values].map(([name, value]) => `${indent}  --${name}: ${value};`), `${indent}}`].join(
      "\n",
    ),
  ];

  const snapped = declaredScales(skin.variables).flatMap((scale) =>
    scale.steps
      .map((step) => [step.name, snappedValue(scale, step)] as const)
      .filter((pair): pair is readonly [string, string] => pair[1] !== null),
  );

  if (snapped.length > 0) {
    blocks.push(
      [
        `${indent}@supports ${ROUND_SUPPORT_TEST} {`,
        `${indent}  :root {`,
        ...snapped.map(([name, value]) => `${indent}    --${name}: ${value};`),
        `${indent}  }`,
        `${indent}}`,
      ].join("\n"),
    );
  }

  return blocks;
}
