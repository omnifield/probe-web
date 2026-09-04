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

import { defineConfig } from "@web-core/build/vite";
import { defineTestConfig } from "@web-core/build/vitest";
import * as values from "@web-core/style";
import * as tools from "@web-core/style-tools";
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
    expect(raw).toMatchObject({ extends: "@web-core/build/tsconfig" });
    expect(raw).not.toHaveProperty("compilerOptions");
  });
});

describe("значения и инструменты — две разные поставки (`PWEB-3`)", () => {
  // Разрез между набором значений и ящиком инструментов держится не намерением, а тем, что
  // потребитель ОБЪЯВЛЯЕТ обе поставки и берёт из каждой своё. Вернуть реэкспорт инструментов
  // в набор значений можно молча: приложение продолжит собираться, а свойство «инструменты
  // необязательны» станет ложью, потому что их снова привозит одна установка.

  /** Манифест зоны — то, что видно потребителю до всякой сборки. */
  function manifest(): { dependencies?: Record<string, string> } {
    return JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
  }

  it("в манифесте зоны объявлены обе, и одна не приезжает следом за другой", () => {
    const dependencies = manifest().dependencies ?? {};

    expect(dependencies).toHaveProperty("@web-core/style");
    expect(dependencies).toHaveProperty("@web-core/style-tools");
  });

  it("набор значений инструментов не отдаёт", () => {
    // Здесь краснеет возвращённый реэкспорт: приложение от него не сломается, а разрез —
    // сломается. Имена перечислены поштучно, потому что стережём именно их переезд.
    expect(values).not.toHaveProperty("createStyle");
    expect(values).not.toHaveProperty("cva");
    expect(values).not.toHaveProperty("cn");
  });

  it("ящик инструментов значений не отдаёт", () => {
    // Обратная сторона того же разреза: инструменты не знают ни одного нашего токена, иначе
    // взять их «у кого-то ещё» стало бы невозможно. Прежде здесь стереглось и имя палитры по
    // умолчанию — его больше нет ни в одной поставке (`PWEB-52`), и стеречь в инструментах
    // нечего. На его месте — построение из семени: оно осталось, и уехать в инструменты ему
    // тоже нельзя.
    expect(tools).toHaveProperty("createStyle");
    expect(tools).toHaveProperty("cva");
    expect(tools).toHaveProperty("cn");
    expect(tools).not.toHaveProperty("createThemeController");
    expect(tools).not.toHaveProperty("buildScale");
  });
});

describe("набор значений — язык, а не палитра (`PWEB-52`)", () => {
  // Эталон — гейт цепочки, и это ровно тот шов, который он обязан стеречь: вернётся в
  // поставку надеваемая палитра — приложение БЕЗ скина снова приедет крашеным, соберётся
  // зелёным и станет неотличимо от одетого. Здесь это краснеет до всякой сборки.

  it("имени палитры по умолчанию в поверхности нет", () => {
    expect(values).not.toHaveProperty("DEFAULT_PALETTE");
  });

  it("положительный контроль: язык значений на месте — ушёл набор, а не он", () => {
    // Негатив без положительного контроля зелен и на пустом объекте: развалится импорт
    // поверхности — «палитры нет» подтвердится, потому что нет ничего. Контроль показывает,
    // что проба вообще что-то видит.
    //
    // Носитель взят из ЯЗЫКА значений — построение шкалы из семени. Прежним носителем был
    // `DEFAULT_PALETTE`, и он не пережил первого же снятия: это был готовый НАБОР, то есть
    // ровно то, что фреймворк перестал везти. Этот переживёт и следующее: он не называет вид
    // и не хранит значений — он способ их получить. На нём стоит пересеваемость скина
    // (поменял семя — поменялись обе половины), и снять его значило бы снять её.
    //
    // Роли на этом месте были бы третьей ошибкой того же рода: они называют вид, без скина
    // пусты и уедут вместе с ним, если уедут.
    expect(values).toHaveProperty("buildScale");
  });
});
