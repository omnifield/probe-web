import { value } from "./value.js";

export function describeFixture(): string {
  return `${value.name}:${value.double(21)}`;
}

export const builtObject = defineFixture({ label: "built", size: 3 });

function defineFixture<T extends { label: string; size: number }>(input: T): T & { computed: number } {
  return { ...input, computed: input.size * 10 };
}
