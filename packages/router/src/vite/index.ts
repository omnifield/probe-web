import { tanstackRouter, type Config } from "@tanstack/router-plugin/vite";
import type { Plugin } from "vite";

export type TanstackRouterVitePluginOptions = Partial<Omit<Config, "target">>;

export function tanstackRouterVitePlugin(options: TanstackRouterVitePluginOptions = {}): Plugin | Plugin[] {
  return tanstackRouter({ target: "solid", autoCodeSplitting: true, ...options });
}
