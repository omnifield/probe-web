// Проба ПОТРЕБИТЕЛЯ: кит ставится ИЗ ТАРБОЛА в `node_modules`, конфигом стоит голый
// `defineTestConfig()`, и в этом потребителе гоняется render-проба на примитиве кита
// (`tasker:PROBEWEB-38`; заявка мира — `tasker:PROBEWEB-37`).
//
// Предмет пробы — не кит, а пресет: кит взят потому, что он единственный наш пакет, который
// отдаёт непреобразованный JSX по условию `solid` и тянет за собой чужие такие же
// (`@kobalte/core` и соседи). Проба обязана падать, если пресет перестанет их трансформировать.
//
// РЕШАЮЩЕЕ УСЛОВИЕ — не форма установки, а МАНИФЕСТ потребителя. Замерено 2026-08-18 на четырёх
// раскладках (кит тарболом и симлинком, `@kobalte/core` рядом с китом и вложенным в него):
// пакет, объявленный в `dependencies` потребителя, раннер трансформирует; тот же пакет,
// приехавший ТРАНЗИТИВНО, он отдаёт ноде как есть — и `.jsx` падает. Поэтому потребитель здесь
// объявляет кит и `solid-js`, а `@kobalte/core` лежит вложенным в кит и НЕ объявлен: ровно так
// его получает мир. Объяви его тут — и проба зеленела бы на сломанном пресете, поэтому её
// собственный манифест сверяется отдельным утверждением.
//
// Тарбол (а не `workspace:*`, как в `test/fixture`) — потому что предмет пробы это поставка:
// потребитель получает `dist` пакета и его `exports`, а не наши исходники (образец — `surface`-
// пробы зоны `ui`).
//
// РАСКЛАДКУ ЗДЕСЬ ДЕЛАЕТ ПРОБА, а не менеджер пакетов, и отсюда её обязанность: положить всё,
// что положил бы менеджер. Собственные зависимости кита — тоже: потребитель их не объявляет и
// знать о них не обязан, но у него они есть. Пока проба клала только peer'ы, новая зависимость
// кита красила её отказом разрешения — то есть сообщением не о предмете (`PWEB-17`). Перечни
// берутся из манифеста кита; списков имён здесь нет нигде, кроме одного — `TRANSITIVE_PEERS`,
// где важно не имя пакета, а то, что потребитель его НЕ объявляет.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const kitDir = resolve(pkgRoot, "..", "ui");

const OWN_PKG = "@omnifield/probe-web-build";
const KIT = "@omnifield/probe-web-ui";
/** Имя пробы у потребителя — по нему сверяется, что прошла именно она, а не пустой набор. */
const CONSUMER_TEST = "рендерит примитив кита из тарбола";

const kitManifest = JSON.parse(readFileSync(join(kitDir, "package.json"), "utf8")) as {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/**
 * Peer'ы кита, которые ставятся ВЛОЖЕННЫМИ в него и в манифесте потребителя не объявлены —
 * транзитивные зависимости, как их видит мир. Остальные peer'ы потребитель объявляет сам.
 */
const TRANSITIVE_PEERS = ["@kobalte/core"];

/** Что раннеру нужно принести с собой: у потребителя это его собственные devDependencies. */
const RUNNER_DEPS = ["vitest", "vite", "jsdom", "solid-js"];

type Report = {
  numFailedTestSuites: number;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: {
    status: string;
    message?: string;
    assertionResults: { title: string; status: string }[];
  }[];
};

let workDir = "";
/** Корень потребителя: тарбол кита распакован в `node_modules`, конфигом — голый пресет. */
let install = "";
let report: Report;
/** Вывод вложенного прогона целиком — он и есть сообщение о причине, когда проба красная. */
let output = "";

/**
 * Ссылка на уже поставленную копию пакета — так его приносит потребитель.
 *
 * @param from — где взять копию
 * @param name — имя пакета
 * @param into — в чьи `node_modules` положить (по умолчанию корень потребителя)
 */
function link(from: string, name: string, into = install): void {
  const target = join(from, "node_modules", name);
  if (!existsSync(target)) throw new Error(`нет копии ${name} в ${from}/node_modules`);

  const path = join(into, "node_modules", name);
  mkdirSync(dirname(path), { recursive: true });
  symlinkSync(target, path, "dir");
}

beforeAll(() => {
  // Пресет едет потребителю СОБРАННЫМ: без `dist` он бы взял исходники, и проба проверяла бы
  // не поставку. `pnpm test` зоны собирает пакет перед прогоном.
  if (!existsSync(join(pkgRoot, "dist", "vitest.js"))) {
    throw new Error("пакет не собран: сначала `pnpm run build` в packages/build");
  }

  // Кит собирает своя зона, и в репозитории его `dist` не лежит (он в `.gitignore`). Здесь
  // нужен его тарбол, поэтому сборку зовём сами — иначе проба падала бы на пустом `dist` и
  // сообщала не про пресет.
  if (!existsSync(join(kitDir, "dist", "index.jsx"))) {
    execFileSync("pnpm", ["run", "build"], {
      cwd: kitDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  workDir = mkdtempSync(join(tmpdir(), "probe-web-build-kit-"));
  install = join(workDir, "consumer");

  execFileSync("pnpm", ["pack", "--pack-destination", workDir], {
    cwd: kitDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const tarball = readdirSync(workDir).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("pnpm pack не оставил тарбол кита");

  // Кит ложится РЕАЛЬНОЙ папкой внутрь `node_modules` — распакованным тарболом, как его кладёт
  // установка у потребителя.
  mkdirSync(join(install, "node_modules", "@omnifield"), { recursive: true });
  execFileSync("tar", ["-xzf", join(workDir, tarball), "-C", workDir]);
  execFileSync("mv", [join(workDir, "package"), join(install, "node_modules", KIT)]);

  // Peer'ы кита: часть потребитель ставит себе (их он и объявляет), `@kobalte/core` приезжает
  // ВЛОЖЕННЫМ в кит и остаётся транзитивным. Копии берём поставленные в зоне `ui` — иначе в
  // дереве оказались бы две копии Solid и рассыпалась бы реактивность, а не разрешение.
  const declaredPeers = Object.keys(kitManifest.peerDependencies ?? {}).filter(
    (peer) => !TRANSITIVE_PEERS.includes(peer),
  );
  for (const peer of declaredPeers) link(kitDir, peer);
  for (const peer of TRANSITIVE_PEERS) link(kitDir, peer, join(install, "node_modules", KIT));

  // СОБСТВЕННЫЕ зависимости кита ставит менеджер — потребитель их не объявляет и о них не знает
  // (`@zag-js/anatomy`: анатомия нужна и паспорту, и самим компонентам). Раскладываем их
  // ВЛОЖЕННО в кит, как это делает строгая раскладка pnpm, и берём перечень ИЗ МАНИФЕСТА, а не
  // списком имён: список молча отстаёт от кита, и следующая его зависимость снова покрасила бы
  // пробу отказом разрешения вместо предмета (`PWEB-17`).
  for (const dep of Object.keys(kitManifest.dependencies ?? {})) {
    link(kitDir, dep, join(install, "node_modules", KIT));
  }
  for (const dep of RUNNER_DEPS) {
    if (!existsSync(join(install, "node_modules", dep))) link(pkgRoot, dep);
  }

  // Сам пресет — ссылкой на пакет: у потребителя он тоже стоит в `node_modules`, и его
  // собственные зависимости (`vite-plugin-solid`) разрешаются из него же.
  symlinkSync(pkgRoot, join(install, "node_modules", OWN_PKG), "dir");

  writeFileSync(
    join(install, "package.json"),
    `${JSON.stringify(
      {
        name: "probe-web-build-kit-consumer",
        version: "0.0.0",
        private: true,
        type: "module",
        // Объявлено ровно то, что объявляет мир: кит и его нетранзитивные peer'ы.
        // `@kobalte/core` здесь появиться не должен — он транзитивный, и на этом держится замер.
        dependencies: {
          [KIT]: `^${kitManifest.version}`,
          ...Object.fromEntries(
            declaredPeers.map((peer) => [peer, kitManifest.peerDependencies?.[peer] ?? "*"]),
          ),
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  // Ровно то, что ляжет у потребителя, и НИ СТРОКИ добавок: пресет — замороженная поверхность
  // (`kb:PROBEWEB-4`), значит проба на компонент кита обязана проходить на нём голом.
  writeFileSync(
    join(install, "vitest.config.ts"),
    `import { defineTestConfig } from "${OWN_PKG}/vitest";\n\nexport default defineTestConfig();\n`,
    "utf8",
  );

  mkdirSync(join(install, "test"), { recursive: true });
  writeFileSync(
    join(install, "test", "button.test.tsx"),
    `import { render } from "solid-js/web";
import { Button } from "${KIT}";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("компонент потребителя на примитиве кита", () => {
  it(${JSON.stringify(CONSUMER_TEST)}, () => {
    const host = document.createElement("div");
    document.body.append(host);

    render(() => <Button>сохранить</Button>, host);

    const node = host.querySelector('button[data-slot="button"]');
    expect(node).not.toBeNull();
    expect(node?.textContent).toBe("сохранить");
    // \`type="button"\` ставит kobalte — значит примитив приехал вместе со своим поведением,
    // а не выродился в пустой узел.
    expect(node?.getAttribute("type")).toBe("button");
  });
});
`,
    "utf8",
  );

  const reportPath = join(workDir, "report.json");
  const vitest = join(pkgRoot, "node_modules", ".bin", "vitest");
  if (!existsSync(vitest)) throw new Error("в зоне не установлен vitest");

  try {
    output = execFileSync(vitest, ["run", "--reporter=json", `--outputFile=${reportPath}`], {
      cwd: install,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    // Падение вложенного прогона — содержательный результат, а не авария пробы: отчёт vitest
    // пишет и в этом случае, а вывод нужен целиком, иначе причину придётся искать вслепую.
    const failure = error as { stdout?: string; stderr?: string };
    output = `${failure.stdout ?? ""}\n${failure.stderr ?? ""}`;
  }

  if (!existsSync(reportPath)) throw new Error(`вложенный прогон не оставил отчёт:\n${output}`);
  report = JSON.parse(readFileSync(reportPath, "utf8")) as Report;
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("раскладка потребителя — на ней держится замер", () => {
  it("кит приехал поставкой: распакованный тарбол с веткой `solid`", () => {
    const installed = join(install, "node_modules", KIT);

    expect(lstatSync(installed).isSymbolicLink()).toBe(false);
    expect(existsSync(join(installed, "dist", "index.jsx"))).toBe(true);
  });

  it("ветка `solid` кита несёт НЕпреобразованный JSX — иначе проверять нечего", () => {
    const jsx = readFileSync(join(install, "node_modules", KIT, "dist", "index.jsx"), "utf8");

    expect(jsx).toContain("<KobalteButton");
    expect(jsx).not.toContain("solid-js/web");
  });

  it("транзитивные peer'ы кита НЕ объявлены у потребителя и лежат внутри кита", () => {
    // Главное условие живости пробы: объявленный пакет раннер трансформирует, и на объявленном
    // `@kobalte/core` проба зеленела бы даже при сломанном пресете (замерено 2026-08-18).
    // Именно поэтому `tables` и `reference` в нашем дереве зелёные — они объявляют его сами.
    const manifest = JSON.parse(readFileSync(join(install, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };

    for (const peer of TRANSITIVE_PEERS) {
      expect(Object.keys(manifest.dependencies)).not.toContain(peer);
      expect(existsSync(join(install, "node_modules", KIT, "node_modules", peer))).toBe(true);
      expect(existsSync(join(install, "node_modules", peer))).toBe(false);
    }
  });

  it("собственные зависимости кита разложены при нём, а не объявлены потребителем", () => {
    // Утверждение стоит здесь, а не в комментарии, потому что именно этой раскладки в пробе не
    // было: кит объявил `@zag-js/anatomy`, менеджер у мира её ставит, а проба — нет, и
    // потребитель падал на разрешении импорта (`PWEB-17`). Перечень берётся из манифеста кита,
    // поэтому утверждение накрывает и следующую его зависимость, а не только эту.
    const declared = Object.keys(kitManifest.dependencies ?? {});
    expect(declared.length).toBeGreaterThan(0);

    const manifest = JSON.parse(readFileSync(join(install, "package.json"), "utf8")) as {
      dependencies: Record<string, string>;
    };

    for (const dep of declared) {
      expect(Object.keys(manifest.dependencies)).not.toContain(dep);
      expect(existsSync(join(install, "node_modules", KIT, "node_modules", dep))).toBe(true);
    }
  });
});

describe("проба на компонент кита у потребителя", () => {
  it("прогон на ГОЛОМ defineTestConfig() зелёный", () => {
    // Считаем упавшие НАБОРЫ, а не тесты: при отказе на импорте зависимости набор не
    // собирается вовсе, тестов в отчёте ноль — и `numFailedTests === 0` подтвердил бы дефект
    // как успех.
    expect(report.numFailedTestSuites, output).toBe(0);
    expect(report.numFailedTests, output).toBe(0);
    expect(report.numPassedTests).toBe(report.numTotalTests);
  });

  it("прошла именно render-проба на примитиве кита", () => {
    const passed = report.testResults
      .flatMap((file) => file.assertionResults)
      .filter((test) => test.status === "passed")
      .map((test) => test.title);

    expect(passed).toContain(CONSUMER_TEST);
  });

  it("не оставляет отказа по расширению файла зависимости", () => {
    // Симптом заявки мира дословно: `Unknown file extension ".jsx"`. Названный явно, он
    // читается как сам себя, а не как «что-то упало».
    const messages = report.testResults.map((file) => file.message ?? "").join("\n");

    expect(`${output}\n${messages}`).not.toMatch(/Unknown file extension/);
  });
});
