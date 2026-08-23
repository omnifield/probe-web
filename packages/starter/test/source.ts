// Общий доступ к самому пакету: пробы судят ОБЪЯВЛЕНИЕ и ГРУЗ, а не свою копию их.
// Читаем ровно те файлы, которые уедут в тарбол, иначе проба подтверждала бы фикстуру.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Корень пакета обвеса.
 *
 * Путь собирается `node:path`, а не `new URL(…, import.meta.url)`: под документным движком
 * глобальный `URL` — движковый, файловую схему он не разбирает, и проба падала бы на разборе
 * собственного адреса. `fileURLToPath` берёт строку и парсит её сам, поэтому работает в обоих
 * прогонах одинаково.
 */
export const ROOT = `${resolve(fileURLToPath(import.meta.url), "../..")}/`;

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

export const manifest = JSON.parse(readFileSync(`${ROOT}package.json`, "utf-8")) as Manifest;

export const declaration = manifest.baser;

/** Дефолты настроек — ровно те значения, с которыми обвес поедет к потребителю. */
export const defaults: Record<string, unknown> = Object.fromEntries(
  Object.entries(declaration.settings).map(([name, spec]) => [name, spec.default]),
);

/** Содержимое файла груза по пути записи раскладки (`src`). */
export function readTemplate(src: string): string {
  return readFileSync(`${ROOT}${declaration.source.contentRoot}/${src}`, "utf-8");
}
