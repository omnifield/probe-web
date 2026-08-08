// Общий доступ к самому пакету: пробы судят ОБЪЯВЛЕНИЕ и ГРУЗ, а не свою копию их.
// Читаем ровно те файлы, которые уедут в тарбол, иначе проба подтверждала бы фикстуру.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Корень пакета обвеса. */
export const ROOT = fileURLToPath(new URL("..", import.meta.url));

export interface SettingSpec {
  readonly title: string;
  readonly description?: string;
  readonly type: string;
  readonly default?: unknown;
  readonly defaultFrom?: string;
}

export interface LayoutEntry {
  readonly src: string;
  readonly dest: string;
  readonly render?: boolean;
  readonly class?: string;
}

export interface Declaration {
  readonly formVersion: number;
  readonly source: { readonly id: string; readonly title: string; readonly contentRoot: string };
  readonly settings: Readonly<Record<string, SettingSpec>>;
  readonly layout: readonly LayoutEntry[];
}

export interface Manifest {
  readonly name: string;
  readonly version: string;
  readonly files: readonly string[];
  readonly baser: Declaration;
}

export const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
) as Manifest;

export const declaration = manifest.baser;

/** Дефолты настроек — ровно те значения, с которыми обвес поедет к потребителю. */
export const defaults: Record<string, unknown> = Object.fromEntries(
  Object.entries(declaration.settings).map(([name, spec]) => [name, spec.default]),
);

/** Содержимое файла груза по пути записи раскладки (`src`). */
export function readTemplate(src: string): string {
  return readFileSync(`${ROOT}${declaration.source.contentRoot}/${src}`, "utf-8");
}
