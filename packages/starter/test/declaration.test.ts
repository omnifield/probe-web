// ОБЪЯВЛЕНИЕ. Судим форму блока `baser` и перечень поставки: это единственное, что читает
// чужая дверь, и ошибка здесь выясняется у потребителя, а не у нас.

import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { declaration, manifest, ROOT } from "./source.js";

/**
 * Форма 3 — не «свежая», а ЕДИНСТВЕННАЯ, проходящая все ворота установленного CLI
 * (`tasker:PROBEWEB-1`, грабля первая). Образец в ТЗ показывал 7 — там же и назван их
 * дефектом. Проба стоит здесь, чтобы «подниму заодно» не уехало к потребителю отказом.
 */
const FORM_VERSION = 3;

/** Чужие артефакты: у файла один хозяин (`kb:BASER3-2`), спор за них всплыл бы у потребителя. */
const NOT_OURS = [
  ".gitignore",
  ".devcontainer",
  "README.md",
  "package.json",
  ".omnifield",
  ".claude",
];

describe("объявление обвеса", () => {
  it("называет форму 3", () => {
    expect(declaration.formVersion).toBe(FORM_VERSION);
  });

  it("называет личность двумя сегментами, а не именем npm-пакета", () => {
    expect(declaration.source.id).toBe("omnifield/probe-web");
    expect(declaration.source.id).not.toBe(manifest.name);
    expect(declaration.source.id).toMatch(/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/);
  });

  it("держит версию в манифесте пакета и не заводит ей второго места", () => {
    // Номер здесь не назван нарочно: версию поднимает architect при публикации, и проба
    // на конкретное значение краснела бы ровно на его выпуске. Инвариант — что место
    // ОДНО: второе объявление разъехалось бы с первым молча.
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(declaration.source).not.toHaveProperty("version");
  });
});

describe("раскладка", () => {
  it("кладёт ровно пять артефактов", () => {
    expect(declaration.layout).toHaveLength(5);
  });

  it("целится в web/, а не в корень", () => {
    // В `omnifield/sandbox` лягут ДВА обвеса — Go соседа в core/ и наш в web/. Оба в
    // корень значит перемешанные скелеты (`kb:PROBEWEB-4`).
    for (const entry of declaration.layout) {
      expect(entry.dest.startsWith("web/"), `${entry.dest} мимо web/`).toBe(true);
    }
  });

  it("не трогает чужих артефактов", () => {
    for (const entry of declaration.layout) {
      for (const alien of NOT_OURS) {
        expect(entry.dest === alien || entry.dest.startsWith(`${alien}/`)).toBe(false);
      }
    }
  });

  it("держит все пять классом placed-once", () => {
    // `regenerated` затёр бы код продукта при следующем применении. Обратная сторона
    // названа и принята: ошибку в скелете обвесом уже не починить (`kb:BASER3-2`).
    for (const entry of declaration.layout) {
      expect(entry.class, entry.dest).toBe("placed-once");
    }
  });

  it("рендерит только манифест, остальное везёт байт в байт", () => {
    // Файл, похожий на шаблон, без `render: false` отрендерится сам в себя — одна из
    // граблей, за которые baser уже заплатил (`tasker:PROBEWEB-1`).
    const rendered = declaration.layout.filter((entry) => entry.render !== false);
    expect(rendered.map((entry) => entry.dest)).toEqual(["web/package.json"]);
  });

  it("не объявляет один dest дважды", () => {
    const dests = declaration.layout.map((entry) => entry.dest);
    expect(new Set(dests).size).toBe(dests.length);
  });

  it("ссылается только на реально лежащие файлы", () => {
    for (const entry of declaration.layout) {
      const file = `${ROOT}${declaration.source.contentRoot}/${entry.src}`;
      expect(existsSync(file), `нет ${entry.src}`).toBe(true);
    }
  });
});

describe("настройки", () => {
  it("объявлены ровно те, что действуют В МОМЕНТ УКЛАДКИ", () => {
    // Порт дев-сервера сюда не выносится намеренно: он попал бы в файл один раз и
    // застыл. То, что человек крутит потом, живёт за пакетами (`tasker:PROBEWEB-1`).
    expect(Object.keys(declaration.settings).sort()).toEqual([
      "buildVersion",
      "productName",
      "runtimeVersion",
      "styleVersion",
      "uiVersion",
    ]);
  });

  it("даёт настройку версии каждому пакету, который называет манифест скелета", () => {
    // Хардкод версии в шаблоне заморозил бы её у потребителя навсегда И заставил бы
    // starter ждать публикации четырёх зон. Настройка снимает обе цены сразу
    // (`kb:PROBEWEB-4`): дефолты проставляет architect перед публикацией.
    const skeleton = readFileSync(
      `${ROOT}${declaration.source.contentRoot}/package.json.ejs`,
      "utf-8",
    );
    for (const zone of ["runtime", "build", "ui", "style"]) {
      const setting = `${zone}Version`;
      expect(declaration.settings, setting).toHaveProperty(setting);
      expect(skeleton, setting).toContain(`"@omnifield/probe-web-${zone}": "<%- ${setting} %>"`);
    }
  });

  it("каждая несёт title, description, type и дефолт", () => {
    for (const [name, spec] of Object.entries(declaration.settings)) {
      // Это же описание пульта: интерфейс рисует форму по нему, ничего про обвес не
      // зная (`kb:BASER3-34`). Настройка без дефолта означала бы вопрос пользователю, а
      // вопросов у двери не бывает.
      expect(spec.title, name).toBeTruthy();
      expect(spec.description, name).toBeTruthy();
      expect(spec.type, name).toBe("string");
      expect(typeof spec.default, name).toBe("string");
    }
  });
});

describe("состав поставки", () => {
  it("увозит груз целиком", () => {
    expect(manifest.files).toContain(declaration.source.contentRoot);
  });

  it("README едет вопреки files — значит его правка меняет поставку", () => {
    // npm всегда кладёт README, манифест и LICENSE (`tasker:PROBEWEB-1`). Проба стоит,
    // чтобы файл не исчез молча: он и есть дока потребителя.
    expect(manifest.files).not.toContain("README.md");
    expect(existsSync(`${ROOT}README.md`)).toBe(true);
  });

  it("публикуется в GitHub Packages", () => {
    // Пакет без метки `latest` дверь не видит вовсе (`tasker:BASER2-216`); переезд на
    // публичный npm объявлен и не начат (`kb:ADR-19`).
    expect(manifest).toHaveProperty(
      "publishConfig.registry",
      "https://npm.pkg.github.com",
    );
  });
});
