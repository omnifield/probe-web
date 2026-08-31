// Design notes: ./README.md#refused

import type { SkinFlaw } from "../rules/index.js";

export class SkinRefused extends Error {
  readonly flaws: readonly SkinFlaw[];

  constructor(what: string, flaws: readonly SkinFlaw[]) {
    super(
      `[probe-web-skin] ${what} was refused: ${flaws.length} flaw(s).\n` +
        flaws.map((flaw) => `  • ${flaw.name} — ${flaw.where}: ${flaw.means}`).join("\n"),
    );
    this.name = "SkinRefused";
    this.flaws = flaws;
  }
}
