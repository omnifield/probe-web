import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
import type { AvatarProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

const visible = {
  name: "visible",
  mark: { kind: "attribute", name: "data-state", value: "visible" },
} as const satisfies PassportState;

const hidden = {
  name: "hidden",
  mark: { kind: "attribute", name: "data-state", value: "hidden" },
} as const satisfies PassportState;

const visibleHidden: readonly PassportState[] = [visible, hidden];

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "image", states: visibleHidden },
    { name: "fallback", states: visibleHidden },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<AvatarProps>()({}),
});
