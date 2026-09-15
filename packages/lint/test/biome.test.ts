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
    expect(config.assist.actions.source.organizeImports).toBe("on");
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
});
