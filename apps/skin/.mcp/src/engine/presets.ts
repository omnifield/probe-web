import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { Form, Palette } from "@web-core/skin/model";
import { createPresetsClient, type PresetKind } from "@web-core/skin/presets";

export type { PresetKind };

/** Путь ручки у службы раздачи — GraphQL, единая точка входа (REST снят, см. `packages/skin/src/
 *  presets/client.ts`). Не настройка. */
const GRAPHQL_PATH = "/graphql";

/** Служба на этой же машине — когда снаружи не сказано ничего. */
const LOCAL = "http://127.0.0.1:8787";

/** Корень воркспейса по маркеру, вверх от места запуска. Тот же приём и тот же довод, что в
 *  `packages/build` (`vite/app.ts`): считать `../..` от файла нельзя — пакет резолвится
 *  симлинком, а сервер запускают из разных папок. */
function workspaceRoot(from: string = process.cwd()): string | undefined {
  let dir = resolve(from);

  for (;;) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;

    const up = dirname(dir);
    if (up === dir) return undefined;
    dir = up;
  }
}

/** Подтягивает корневой `.env` воркспейса в `process.env`.
 *
 *  Фронту его читает Vite, а этот сервер — отдельный процесс, до него Vite не дотягивается: без
 *  этого шага витрина уже ходила бы на стенд, а MCP молча остался бы на службе своей машины, и
 *  агент правил бы НЕ ТЕ пресеты, которые человек видит в браузере. Файла нет — не беда, дальше
 *  работают умолчания. Заданное в окружении сильнее файла: так стенд переопределяют на одну
 *  команду, не трогая общий файл. */
function loadWorkspaceEnv(): void {
  const root = workspaceRoot();
  if (root === undefined) return;

  const file = resolve(root, ".env");
  if (!existsSync(file)) return;

  try {
    process.loadEnvFile(file);
  } catch {
    // Нечитаемый или битый файл — не повод не подняться: адрес возьмётся из умолчаний.
  }
}

loadWorkspaceEnv();

/** Адрес службы. `SKIN_MCP_PRESETS_URL` — ручка именно этого процесса, `PRESETS_URL` — общий
 *  адрес воркспейса из корневого `.env`, тот же, что читает витрина. Путь дописываем сами, если
 *  дали только адрес службы: в `.env` естественно записать `https://host:port`. */
function resolveUrl(): string {
  const given = process.env["SKIN_MCP_PRESETS_URL"] ?? process.env["PRESETS_URL"];
  const base = (given ?? "").trim().replace(/\/+$/, "") || LOCAL;

  return base.endsWith(GRAPHQL_PATH) ? base : base + GRAPHQL_PATH;
}

/** Тот же GraphQL-адрес, что несёт `presets` — фидбэк живёт в той же службе, отдельной сущностью
 *  (`@web-core/neurobox/zone-feedback`), не видом пресета, поэтому свой клиент, но не свой адрес. */
export const presetsServiceUrl = resolveUrl();

/** Клиент службы раздачи — общий на всю зону, вместо самописного HTTP-провода: та же служба,
 *  тот же GraphQL, что уже пьёт витрина через `@web-core/skin/presets`. `PresetsDown`/
 *  `PresetsRefused` (тот же пакет) — единственные классы отказа, которые он бросает. */
export const presets = createPresetsClient({ url: presetsServiceUrl });

export async function readPalettes(): Promise<Palette[]> {
  return (await presets.list("palette")).map((record) => record.state);
}

export async function readForms(): Promise<Form[]> {
  return (await presets.list("form")).map((record) => record.state);
}
