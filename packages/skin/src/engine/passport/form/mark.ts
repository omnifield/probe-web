
export type PassportMark =
  | {
      readonly kind: "attribute";
      readonly name: string;
      readonly value?: string;
    }
  | {
      readonly kind: "pseudo";
      readonly name: string;
    };
