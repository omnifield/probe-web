
export const SCOPE = "data-scope";

export const PART = "data-part";

export function safeName(name: string): boolean {
  return name.length > 0 && !/["\\]/.test(name);
}

export function attribute(name: string, value?: string): string {
  return value === undefined ? `[${name}]` : `[${name}="${value}"]`;
}
