import { createAnatomy } from "@web-core/skin/model";

export const anatomy = createAnatomy("surface").parts("root");

export const anatomyParts = anatomy.build();
