import { trace } from "../engine/trace.js";
import { WRITTEN_BASE } from "./written.js";

export function baseCss(): string {
  const done = trace("baseCss");

  const css = [
    `/* @web-core/style/base.css — только сброс, ни одного кастом-свойства и ни одного
   значения. Порождено src/css/generate.ts — править бесполезно, перезапишется. */`,
    WRITTEN_BASE.trimEnd(),
  ].join("\n\n");

  done();
  return `${css}\n`;
}

