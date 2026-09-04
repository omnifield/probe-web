import { createAnatomy } from "@web-core/skin/model";

export const anatomy = createAnatomy("workspace").parts("root", "header", "sidebar", "main", "rightbar", "footer");

export const anatomyParts = anatomy.build();
