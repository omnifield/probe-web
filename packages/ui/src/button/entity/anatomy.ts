import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("button").parts("root");

export const anatomyParts = anatomy.build();
