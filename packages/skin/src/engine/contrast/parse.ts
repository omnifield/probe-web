
import { tryParseColor, type Oklch, type ParsedColor } from "@web-core/style";

const DEPTH = 16;

function closing(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitReference(inside: string): { name: string; fallback?: string } {
  let depth = 0;
  for (let i = 0; i < inside.length; i += 1) {
    if (inside[i] === "(") depth += 1;
    else if (inside[i] === ")") depth -= 1;
    else if (inside[i] === "," && depth === 0) {
      return { name: inside.slice(0, i).trim(), fallback: inside.slice(i + 1).trim() };
    }
  }
  return { name: inside.trim() };
}

export function resolve(value: string, values: Map<string, { value: string }>, depth = 0): string | undefined {
  if (depth > DEPTH) return undefined;

  const open = value.indexOf("var(");
  if (open < 0) return value;

  const paren = open + 3;
  const end = closing(value, paren);
  if (end < 0) return undefined;

  const { name, fallback } = splitReference(value.slice(paren + 1, end));
  const own = values.get(name.startsWith("--") ? name.slice(2) : name)?.value;
  const replacement = own ?? fallback;

  if (replacement === undefined) return undefined;

  return resolve(`${value.slice(0, open)}${replacement}${value.slice(end + 1)}`, values, depth + 1);
}

function pieces(value: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === "(") depth += 1;
    else if (value[i] === ")") depth -= 1;
    else if (value[i] === " " && depth === 0) {
      found.push(value.slice(start, i));
      start = i + 1;
    }
  }
  found.push(value.slice(start));

  return found.filter(Boolean);
}

export function colourOf(value: string): (ParsedColor & { ok: false }) | { ok: true; color: Oklch; text: string } {
  const trimmed = value.trim();
  const whole = tryParseColor(trimmed);

  if (whole.ok) return { ok: true, color: whole.color, text: trimmed };

  let refusal = whole;

  for (const piece of pieces(trimmed).reverse()) {
    const parsed = tryParseColor(piece);

    if (parsed.ok) return { ok: true, color: parsed.color, text: piece };
    if (parsed.refusal === "translucent") refusal = parsed;
  }

  return refusal;
}
