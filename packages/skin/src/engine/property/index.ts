
export function cssProperty(name: string): string {
  return name.startsWith("--") ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
