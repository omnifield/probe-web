
export function bare(name: string): string {
  return name.startsWith("--") ? name.slice(2) : name;
}
