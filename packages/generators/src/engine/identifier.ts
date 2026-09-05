export function identifierFromEntryName(entryName: string, suffix = ""): string {
  const camelCase = entryName.replace(/-([a-z0-9])/gi, (_match, letter: string) => letter.toUpperCase());
  return `${camelCase}${suffix}`;
}
