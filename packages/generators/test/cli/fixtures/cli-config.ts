import { hasFile } from "../../../src/engine/predicates.js";
import { defineConfig } from "../../../src/engine/runner.js";
import type { AggregatePlugin } from "../../../src/engine/types.js";

const rootDir = process.env.CLI_TEST_ROOT_DIR;
if (!rootDir) throw new Error("cli-config.ts fixture requires CLI_TEST_ROOT_DIR");

const listPlugin: AggregatePlugin<string> = {
  name: "list",
  output: `${rootDir}/list.txt`,
  collect: (entries) => entries.map((entry) => entry.name),
  render: (names) => names.join(","),
};

export default defineConfig({
  rootDir,
  isEntry: hasFile("marker.txt"),
  plugins: [listPlugin],
});
