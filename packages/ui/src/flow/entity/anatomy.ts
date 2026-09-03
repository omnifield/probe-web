import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("flow").parts("root", "item");

export const anatomyParts = anatomy.build();
