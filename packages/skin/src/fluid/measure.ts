// Design notes: ./README.md#measure

export const PX_IN_REM = 16;

export function measure(value: string): { readonly amount: number; readonly unit: string } | null {
  const match = /^\s*(-?\d*\.?\d+)\s*([a-z%]*)\s*$/iu.exec(value);
  if (!match) return null;

  const amount = Number(match[1]);

  return Number.isFinite(amount) ? { amount, unit: match[2] ?? "" } : null;
}

export function pixels(amount: number, unit: string): number {
  return unit === "rem" ? amount * PX_IN_REM : amount;
}
