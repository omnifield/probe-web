// MAP of the avatar: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Avatar, AvatarFallback, AvatarImage } from "./index.jsx";

/** The avatar's passport together with whatever draws each of its three parts. */
export const kit = defineKitComponent(passport, {
  root: Avatar,
  image: AvatarImage,
  fallback: AvatarFallback,
});
