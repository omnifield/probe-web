
import type { OutfitFlaw } from "./types.js";

export class OutfitRefused extends Error {
  readonly flaws: readonly OutfitFlaw[];

  constructor(name: string, flaws: readonly OutfitFlaw[]) {
    super(
      `[web-core-skin] outfit "${name}" was refused: ${flaws.length} flaw(s).\n` +
        flaws.map((flaw) => `  • ${flaw.name} — ${flaw.where}: ${flaw.means}`).join("\n"),
    );
    this.name = "OutfitRefused";
    this.flaws = flaws;
  }
}
