
import type { Skin } from "../recipe/index.js";
import { valueNames } from "../seeds/index.js";
import type { ValueVocabulary } from "./types.js";

export function customProperty(name: string): string {
  return name.startsWith("--") ? name : `--${name}`;
}

export function vocabularyOf(skin: Skin | undefined, vocabulary: ValueVocabulary): Set<string> {
  const known = new Set<string>();

  for (const token of vocabulary.tokens ?? []) known.add(customProperty(token));
  if (skin) for (const name of valueNames(skin)) known.add(customProperty(name));

  return known;
}
