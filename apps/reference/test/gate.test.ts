/** @vitest-environment node */
// Гейт стережёт САМ СЕБЯ.
//
// Свойство приложения — «собирается ровно тем, чем собирается потребитель» — держится не
// кодом, а ОТСУТСТВИЕМ кода в трёх файлах оснастки. Отсутствие само себя не защищает: строчка
// `plugins: [...]`, дописанная сюда в добрый час, починит гейт вместо того, чтобы показать
// поломку, и прогон останется зелёным — навсегда и молча.
//
// Сравниваем не текст файлов, а РЕЗУЛЬТАТ: конфиг приложения обязан совпасть с тем, что
// отдаёт зона `build`. Текстовая сверка ломалась бы от каждого комментария.

import { defineConfig } from "@omnifield/probe-web-build/vite";
import { defineTestConfig } from "@omnifield/probe-web-build/vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { UserConfig } from "vite";
import type { ViteUserConfig } from "vitest/config";

import appVite from "../vite.config";
import appVitest from "../vitest.config";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** Имена плагинов по порядку — плагин как объект сравнить нельзя, он несёт функции. */
function pluginNames(config: UserConfig | ViteUserConfig): string[] {
  const names: string[] = [];
  const walk = (item: unknown): void => {
    if (Array.isArray(item)) {
      for (const nested of item) walk(nested);
      return;
    }
    if (item && typeof item === "object" && "name" in item) {
      names.push(String((item as { name: unknown }).name));
    }
  };
  walk(config.plugins);
  return names;
}

/** Всё, кроме плагинов: обычные данные, сравниваются как есть. */
function settings(config: UserConfig | ViteUserConfig): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...config };
  delete copy.plugins;
  return copy;
}

describe("оснастка приложения ничего не добавляет от себя", () => {
  it("конфиг сборки — ровно то, что отдаёт `build/vite`", () => {
    const preset = defineConfig();

    expect(settings(appVite)).toEqual(settings(preset));
    expect(pluginNames(appVite)).toEqual(pluginNames(preset));
  });

  it("конфиг тестов — ровно то, что отдаёт `build/vitest`", () => {
    const preset = defineTestConfig();

    expect(settings(appVitest)).toEqual(settings(preset));
    expect(pluginNames(appVitest)).toEqual(pluginNames(preset));
  });

  it("tsconfig только наследует базовый — своих `compilerOptions` нет", () => {
    // Точка 3 поверхности проверяется прогоном `tsc`, а не тестом: типы — не рантайм. Здесь
    // стережётся другое — что проверять `tsc` будет НАСТРОЙКАМИ ЗОНЫ, а не местными.
    const raw: unknown = JSON.parse(readFileSync(join(ROOT, "tsconfig.json"), "utf8"));
    expect(raw).toMatchObject({ extends: "@omnifield/probe-web-build/tsconfig" });
    expect(raw).not.toHaveProperty("compilerOptions");
  });
});
