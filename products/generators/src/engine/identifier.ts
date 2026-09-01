/**
 * Turns a kebab-case directory name into a camelCase identifier, optionally
 * with a suffix: `identifierFromEntryName("radio-group", "Passport")` →
 * `"radioGroupPassport"`. A generated aggregate file uses this so the
 * identifier a folder gets is a pure function of its name, not a second
 * name chosen by hand that can drift from the first.
 */
export function identifierFromEntryName(entryName: string, suffix = ""): string {
  const camelCase = entryName.replace(/-([a-z0-9])/gi, (_match, letter: string) => letter.toUpperCase());
  return `${camelCase}${suffix}`;
}
