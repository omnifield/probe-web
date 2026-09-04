// см. README.md / FAQ.md
import type { Plugin, UserConfig } from "vite";
import solid from "vite-plugin-solid";

import { generatedCssPlugin } from "./generated-css.js";
import type { DevState } from "./workspace-source.js";
import { workspaceSourcePlugin } from "./workspace-source.js";

/** Опции, которые вывести неоткуда — обычный потребитель не передаёт ничего. */
export interface DefineConfigOptions {
  readonly base?: string;
  readonly proxy?: NonNullable<UserConfig["server"]>["proxy"];
  readonly plugins?: readonly Plugin[];
}

/** Готовый конфиг Vite для приложения на web-core. */
export function defineConfig(options: DefineConfigOptions = {}): UserConfig {
  const state: DevState = { generated: [] };

  return {
    ...(options.base ? { base: options.base } : {}),
    plugins: [solid(), workspaceSourcePlugin(state), generatedCssPlugin(state), ...(options.plugins ?? [])],
    server: {
      host: true, // не "localhost" — см. FAQ.md
      ...(options.proxy ? { proxy: options.proxy } : {}),
    },
  };
}
