import { createMemo, type Accessor } from "solid-js";
import type { AssemblyTree } from "@web-core/assembly";
import type { z } from "@web-core/io";

import { growValidatorLayer, type ValidationIssue } from "../engine/validate.js";

/** Параллель `SkinConnection` (`packages/skin/src/solid/connection.ts`) — `tree`/`data` идут в
 *  контекст КАК ЕСТЬ, не только производный `issuesByPath`: без исходных данных правилу
 *  (`node-rule-evaluation`) нечем резолвиться внутри провайдера. */
export interface ValidationConnection {
  readonly tree: AssemblyTree;
  readonly data: Accessor<unknown>;
  readonly issuesByPath: Accessor<Record<string, readonly ValidationIssue[]>>;
}

export function createValidationConnection(
  tree: AssemblyTree,
  schema: z.ZodType,
  data: Accessor<unknown>,
): ValidationConnection {
  const issuesByPath = createMemo(() => growValidatorLayer(tree, schema, data()));

  return { tree, data, issuesByPath };
}
