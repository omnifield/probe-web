// см. README.md / FAQ.md
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Plugin, UserConfig } from "vite";
import solid from "vite-plugin-solid";

import { trace } from "../shared/trace.js";
import { generatedCssPlugin } from "./generated-css.js";
import type { DevState } from "./workspace-source.js";
import { workspaceSourcePlugin } from "./workspace-source.js";

/** Опции, которые вывести неоткуда — обычный потребитель не передаёт ничего. */
export interface DefineConfigOptions {
  readonly base?: string;
  readonly proxy?: NonNullable<UserConfig["server"]>["proxy"];
  readonly plugins?: readonly Plugin[];
}

/** Корень воркспейса — папка с `pnpm-workspace.yaml`, вверх от места запуска.
 *
 *  Зачем вообще: `envDir` у Vite по умолчанию равен корню ПРИЛОЖЕНИЯ, поэтому каждое читало бы
 *  свой `.env`, и адрес одного и того же стенда пришлось бы держать в стольких копиях, сколько
 *  у нас приложений. Копии расходятся молча — одно приложение уже на сервере, соседнее ещё на
 *  своей машине, и по коду это не видно. Воркспейс один, стенд один — файл тоже один, в корне.
 *
 *  Ищем по маркеру, а не считаем `../..` от этого файла: пакет резолвится симлинком, а после
 *  переезда на реестр лёг бы в `node_modules`, и относительный путь показал бы не туда. */
function workspaceRoot(from: string = process.cwd()): string {
  let dir = resolve(from);

  for (;;) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;

    const up = dirname(dir);
    if (up === dir) return resolve(from); // маркера нет — ведём себя как Vite по умолчанию
    dir = up;
  }
}

/** Готовый конфиг Vite для приложения на web-core. */
export function defineConfig(options: DefineConfigOptions = {}): UserConfig {
  const done = trace("defineConfig");

  const state: DevState = { generated: [] };

  const config: UserConfig = {
    ...(options.base ? { base: options.base } : {}),
    // Один `.env` на воркспейс — см. `workspaceRoot()`.
    envDir: workspaceRoot(),
    // Наружу, в бандл, уезжает ТОЛЬКО помеченное префиксом — остальное из `.env` остаётся у
    // сборки. `PRESETS_URL` добавлен к штатному `VITE_` потому, что этот адрес читает не только
    // фронт: за ним же ходят серверные потребители (`apps/skin/.mcp`), а у них имена без `VITE_`.
    // Префикс, а не одно имя: список опасно расширять поштучно, но и пускать всё подряд нельзя —
    // в корневом `.env` рядом однажды окажется токен.
    envPrefix: ["VITE_", "PRESETS_", "NEUROBOX_"],
    plugins: [solid(), workspaceSourcePlugin(state), generatedCssPlugin(state), ...(options.plugins ?? [])],
    server: {
      host: true, // не "localhost" — см. FAQ.md
      ...(options.proxy ? { proxy: options.proxy } : {}),
    },
  };

  done();
  return config;
}
