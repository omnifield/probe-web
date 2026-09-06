import { randomInt, randomWord } from "./text";

// `payload` в io-схемах почти всегда `z.unknown()` — zocker тут гадать не может. Форма произвольная,
// не по схеме: просто наглядный объект в показе события, а не подобие реальных данных потребителя.
const KEYS = ["id", "value", "count", "flag", "note"] as const;

function randomField(): string | number | boolean {
  const kind = randomInt(0, 2);
  if (kind === 0) return randomWord();
  if (kind === 1) return randomInt(0, 100);
  return Math.random() < 0.5;
}

export function randomPayload(): Readonly<Record<string, string | number | boolean>> {
  const keys = [...KEYS].sort(() => Math.random() - 0.5).slice(0, randomInt(1, KEYS.length));
  return Object.fromEntries(keys.map((key) => [key, randomField()]));
}
