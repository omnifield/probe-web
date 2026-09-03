import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("diagram").parts("root", "axis", "grid");

export const anatomyParts = anatomy.build();
