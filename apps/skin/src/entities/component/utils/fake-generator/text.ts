const WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "labore", "dolore", "magna",
] as const;

export function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)]!;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function targetLength(length: number | readonly [number, number]): number {
  return typeof length === "number" ? length : randomInt(length[0], length[1]);
}

/** Слова до достижения целевой длины — не обрезка на полуслове, читаемый фейковый текст. */
export function fakeText(length: number): string {
  let text = randomWord();
  while (text.length < length) text += ` ${randomWord()}`;
  return text;
}
