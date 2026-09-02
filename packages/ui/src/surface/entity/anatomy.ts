import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("surface").parts("root");

export const anatomyParts = anatomy.build();
