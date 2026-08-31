// Design notes: ./README.md#types

export type SkinGapKind = "component" | "part" | "state";

export type SkinGap =
  | {
      readonly kind: "component";
      readonly component: string;
      readonly means: string;
    }
  | {
      readonly kind: "part";
      readonly component: string;
      readonly part: string;
      readonly means: string;
    }
  | {
      readonly kind: "state";
      readonly component: string;
      readonly part: string;
      readonly state: string;
      readonly means: string;
    };
