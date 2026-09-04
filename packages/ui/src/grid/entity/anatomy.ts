import { createAnatomy } from "@web-core/skin/model";

export const anatomy = createAnatomy("grid").parts("root", "cell");

export const anatomyParts = anatomy.build();
