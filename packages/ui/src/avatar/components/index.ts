export { Avatar, type AvatarProps } from "./root.js";
export { AvatarImage, type AvatarImageProps } from "./image.js";
export { AvatarFallback, type AvatarFallbackProps } from "./fallback.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Avatar } from "./root.js";
import { AvatarImage } from "./image.js";
import { AvatarFallback } from "./fallback.js";

export const kit = defineKitComponent(passport, {
  root: Avatar,
  image: AvatarImage,
  fallback: AvatarFallback,
});
