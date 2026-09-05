import { createServer, mergeConfig, type InlineConfig } from "vite";

export async function importModule<TModule>(modulePath: string, config: InlineConfig = {}): Promise<TModule> {
  const server = await createServer(
    mergeConfig(config, {
      configFile: false,
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: "custom",
    } satisfies InlineConfig),
  );
  try {
    return (await server.ssrLoadModule(modulePath)) as TModule;
  } finally {
    await server.close();
  }
}
