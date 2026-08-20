import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// ГЕЙТ НЕЗАВИСИМОСТИ ПОСТАВКИ (`PWEB-3`).
//
// «Инструменты стилизации — самостоятельная необязательная поставка» — это проверяемое
// свойство, а не абзац в README. Проверяем машиной ровно то, что делает его правдой:
// инструменты не знают набора значений НИ ОДНИМ способом — ни импортом, ни зависимостью,
// ни именем токена, оставшимся в коде.
//
// Почему это стоит отдельной пробы: обратная связь возвращается тихо. Достаточно одному
// `import { ROLE_TOKENS } from "@omnifield/probe-web-style"` заехать «на минуту, ради
// удобства», и необязательность кончилась — вместе с правом скина не брать наши значения.

const root = resolve(import.meta.dirname, "..");
const VALUES_PKG = "@omnifield/probe-web-style";

/**
 * Ловим ИМПОРТ пакета значений, а не упоминание его имени: причина разреза объяснена прямо
 * в шапке `src/index.ts`, и проба, спотыкающаяся о собственное объяснение, заставила бы
 * убрать объяснение — то есть чинила бы след вместо причины. Кавычка справа отсекает
 * `@omnifield/probe-web-style-tools`: наше собственное имя начинается с того же куска.
 */
const VALUES_IMPORT = new RegExp(
  String.raw`(?:from|import|require\()\s*["']${VALUES_PKG}(?:/[^"']*)?["']`,
);

/** Все файлы поставки-исходника, рекурсивно. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? sources(path) : [path];
  });
}

const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

describe("инструменты не зависят от набора значений", () => {
  it("в исходниках нет ни одного импорта пакета значений", () => {
    const guilty = sources(join(root, "src")).filter((file) =>
      VALUES_IMPORT.test(readFileSync(file, "utf8")),
    );
    expect(guilty).toEqual([]);
  });

  it("пакета значений нет ни в одном разделе зависимостей — включая dev", () => {
    // Dev тоже считается: через него зависимость приезжает в прогон, и «работает только
    // вместе» обнаруживается не здесь, а у потребителя.
    for (const section of ["dependencies", "peerDependencies", "devDependencies"] as const) {
      expect(Object.keys(manifest[section] ?? {})).not.toContain(VALUES_PKG);
    }
  });

  it("имён наших токенов в исходниках нет — ни ролей, ни ступеней", () => {
    // Инструмент, знающий имя `--brand-solid`, уже привозит вид. Ловим ЛЮБОЕ кастомное
    // свойство: у инструментов классов их не может быть ни одного, поэтому проба не зависит
    // от того, как сегодня называются наши роли.
    const guilty = sources(join(root, "src")).filter((file) =>
      /--[a-z][a-z0-9-]*\s*[:)]/.test(readFileSync(file, "utf8")),
    );
    expect(guilty).toEqual([]);
  });
});
