
export type RoleKind = "color" | "size" | "row";

export interface Role {
  readonly name: string;
  readonly kind: RoleKind;
}
