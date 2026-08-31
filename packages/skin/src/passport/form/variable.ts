// Design notes: ./README.md#variable

export interface PassportVariable {
  readonly name: string;
  readonly setBy: "kit" | "consumer";
}
