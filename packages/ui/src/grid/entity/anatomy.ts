import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("grid").parts("root", "cell");

export const anatomyParts = anatomy.build();
