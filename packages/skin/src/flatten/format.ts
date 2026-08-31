// Design notes: ./README.md#format

import type { Container, Node } from "postcss";

function walkable(node: Node): node is Container {
  return typeof (node as Container).each === "function";
}

function indent(node: Container, depth: number): void {
  node.each((child, index) => {
    const before = child.raws.before;

    if (!before || !before.trim() || before.includes("\n")) {
      const blank = node.type !== "rule" && index > 0 ? "\n" : "";
      child.raws.before = `\n${blank}${"  ".repeat(depth)}`;
    }

    if (!walkable(child)) return;

    indent(child, depth + 1);
    child.raws.after = `\n${"  ".repeat(depth)}`;
    child.raws.semicolon = true;
  });
}

export function prettify(root: Container): void {
  indent(root, 0);

  if (root.first) root.first.raws.before = "";

  root.raws.after = "\n";
}
