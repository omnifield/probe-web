
import { note } from "../../trace/index.js";
import type { SkinFlaw, SkinFlawName } from "./types.js";

export class Flaws {
  readonly list: SkinFlaw[] = [];

  add(name: SkinFlawName, where: string, means: string): void {
    this.list.push({ name, where, means });
    note(`flaw ${name} at ${where}: ${means}`);
  }
}
