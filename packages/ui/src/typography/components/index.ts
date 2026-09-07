export { Typography, type TypographyProps } from "./root.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Typography } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: Typography,
});
