import type { Skeleton } from "./skeleton";

export interface Schema {
  readonly id: string;
  readonly endpointId: string;
  readonly skeleton: Skeleton;
}
