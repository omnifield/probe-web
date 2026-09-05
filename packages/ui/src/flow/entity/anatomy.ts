import { createAnatomy } from "@web-core/skin/model";

export const anatomy = createAnatomy("flow").parts("root", "item");

export const anatomyParts = anatomy.build();
