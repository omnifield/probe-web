// Design notes: ./README.md

import postcss from "postcss";
import nested from "postcss-nested";

import { trace } from "../trace/index.js";
import { prettify } from "./format.js";

const pipeline = postcss([nested()]);

export function flattenCss(css: string): string {
  const done = trace("flattenCss");

  const root = pipeline.process(css, { from: undefined }).root;
  prettify(root);

  done();
  return root.toString();
}
