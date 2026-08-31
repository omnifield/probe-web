// Design notes: ./README.md#scale-roles

import { SCALE_STEPS } from "@omnifield/probe-web-style";

export const SCALE_ROLES: readonly string[] = ["accent", "neutral", "danger", "success", "warning"];

export const STEPS: readonly string[] = [...SCALE_STEPS.map(String), "contrast"];
