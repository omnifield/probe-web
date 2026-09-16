import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { defineBiomeConfig } from "../src/biome/index.js";

const BIOME_BIN = fileURLToPath(new URL("../node_modules/.bin/biome", import.meta.url));

describe("defineBiomeConfig()", () => {
  it("явно задаёт отступ — пробел/2, а не дефолт Biome (таб)", () => {
    const config = defineBiomeConfig();
    expect(config.formatter).toMatchObject({ enabled: true, indentStyle: "space", indentWidth: 2 });
    expect(config.assist.actions.source.organizeImports).toMatchObject({ level: "on" });
    expect(config.linter.enabled).toBe(false);
  });

  /**
   * Настоящий прогон CLI, не мок: доказывает, что сгенерированный конфиг реально сортирует
   * импорты, реально держит 2 пробела (а не молча съезжает на табы) и реально не трогает
   * неиспользуемую переменную — линтер выключен, а не просто типизирован как выключенный.
   */
  it("реальный `biome check --write` сортирует импорты и держит 2 пробела, линтер молчит", () => {
    const dir = mkdtempSync(join(tmpdir(), "lint-biome-"));
    writeFileSync(join(dir, "biome.json"), JSON.stringify(defineBiomeConfig(), null, 2));
    writeFileSync(
      join(dir, "sample.ts"),
      ['import { b } from "./b";', 'import { a } from "./a";', "", "const   unused = 1;", ""].join(
        "\n",
      ),
    );

    execFileSync(BIOME_BIN, ["check", "--config-path=.", "--write", "sample.ts"], { cwd: dir });

    const result = readFileSync(join(dir, "sample.ts"), "utf8");
    expect(result.indexOf('"./a"')).toBeLessThan(result.indexOf('"./b"'));
    expect(result).not.toContain("\t");
    expect(result).toContain("const unused = 1;");
  });

  /**
   * Свои группы импортов (`IMPORT_GROUPS` в `../src/biome/index.ts`) — по прямой просьбе user:
   * голые имена (node + npm) → любой `@`-scoped (наши и чужие вперемешку) → `#`-алиасы →
   * относительные, одним куском, БЕЗ пустой строки между блоками.
   */
  it("группы импортов: голые имена → @-scoped → #-алиасы → относительные, без пустых строк между блоками", () => {
    const dir = mkdtempSync(join(tmpdir(), "lint-biome-groups-"));
    writeFileSync(join(dir, "biome.json"), JSON.stringify(defineBiomeConfig(), null, 2));
    writeFileSync(
      join(dir, "sample.ts"),
      [
        'import { local } from "./local";',
        'import { ui } from "@web-core/ui";',
        'import { readFile } from "node:fs";',
        'import { alias } from "#/shared/thing";',
        'import { z } from "zod";',
        'import { io } from "@web-core/io";',
        'import { tanstack } from "@tanstack/solid-query";',
        'import { solid } from "solid-js";',
        "",
        "export const x = 1;",
        "",
      ].join("\n"),
    );

    execFileSync(BIOME_BIN, ["check", "--config-path=.", "--write", "sample.ts"], { cwd: dir });

    // Чужой (`@tanstack`) и наш (`@web-core`) scoped-пакет — одним блоком, не разведены:
    // это осознанное отличие от первой версии группировки (та же дата, тот же файл).
    expect(readFileSync(join(dir, "sample.ts"), "utf8")).toBe(
      [
        'import { readFile } from "node:fs";',
        'import { solid } from "solid-js";',
        'import { z } from "zod";',
        'import { tanstack } from "@tanstack/solid-query";',
        'import { io } from "@web-core/io";',
        'import { ui } from "@web-core/ui";',
        'import { alias } from "#/shared/thing";',
        'import { local } from "./local";',
        "",
        "export const x = 1;",
        "",
      ].join("\n"),
    );
  });
});
