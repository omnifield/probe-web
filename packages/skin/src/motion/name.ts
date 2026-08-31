// Design notes: ./README.md#name

import { cssProperty } from "../property/index.js";

const MOTION_NAME_PROPERTIES = ["animation", "animation-name"];

export function namesMotion(property: string): boolean {
  return MOTION_NAME_PROPERTIES.includes(cssProperty(property));
}
