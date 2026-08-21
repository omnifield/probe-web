// ГОЛЫЙ КИТ и границы витрины (`PWEB-31`, `kb:PROBEWEB-11`).
//
// Два обещания, которые ломаются молча и потому проверяются по исходникам, а не глазами:
//
//   1. **витрина не одевает кит.** Оболочка витрины красит себя и только себя. Подкрась она
//      части кита — «голое» перестало бы быть проверяемым состоянием: человек видел бы одетое
//      там, где не одевал никто, и первый же скин спорил бы с невидимым соседом;
//   2. **чужие имена не объявляются вторично.** Признак принудительного состояния объявлен
//      механикой скина; написанный здесь литералом, он разъехался бы с ней молча — обе стороны
//      остались бы зелёными, а правило просто перестало бы срабатывать.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { FORCE_ATTRIBUTE } from "@omnifield/probe-web-skin/model";
import { describe, expect, it } from "vitest";

/** Читает файл зоны по пути относительно этой пробы. */
function read(path: string): string {
  return readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
}

describe("оболочка витрины стоит на ролях набора значений", () => {
  const css = readFileSync(resolve(process.cwd(), "src/showcase/showcase.css"), "utf8").replaceAll(
    /\/\*[\s\S]*?\*\//g,
    "",
  );

  it("своих значений не заводит", () => {
    // Свои заводились и были сняты: они прятали чужой дефект — тёмная половина ролей объявлена
    // только внутри темы, и без темы оболочка остаётся светлой. Дефект принадлежит зоне
    // значений; закрыть его своими переменными значит спрятать его от всех, включая
    // потребителя, которому прятать будет нечем.
    expect(css).not.toContain("--ui-");
    expect(css).toContain("var(--surface)");
    expect(css).toContain("var(--text)");
  });
});

describe("витрина не одевает кит", () => {
  // Комментарии вырезаны: имена кита в них НАЗЫВАЮТСЯ (объяснить запрет нельзя, не назвав то,
  // что запрещено), но ничего не адресуют. Проверять надо правила, а не рассказ о них.
  const css = read("../src/showcase/showcase.css").replaceAll(/\/\*[\s\S]*?\*\//g, "");

  it("не адресует части анатомии", () => {
    expect(css).not.toMatch(/data-scope/);
    expect(css).not.toMatch(/data-part/);
  });

  it("не адресует прежние зацепки кита", () => {
    expect(css).not.toMatch(/data-slot/);
  });

  it("не адресует состояния кита — вид состояния принадлежит скину", () => {
    expect(css).not.toMatch(/data-disabled|data-pressed|data-expanded|aria-busy/);
  });
});

describe("чужие имена берутся, а не переписываются", () => {
  it("признак состояния приезжает из механики скина", () => {
    expect(FORCE_ATTRIBUTE).toBe("data-force");
    expect(read("../src/showcase/cases.ts")).toContain("FORCE_ATTRIBUTE");
  });

  it("в случаях нет имени признака литералом", () => {
    const source = read("../src/showcase/cases.ts");
    const withoutComments = source.replaceAll(/\/\/.*$/gm, "");

    expect(withoutComments).not.toContain(`"${FORCE_ATTRIBUTE}"`);
  });
});

describe("в зоне не осталось прежнего поколения", () => {
  it("своего перечня компонентов витрина не ведёт", () => {
    const source = read("../src/showcase/app.tsx");

    expect(source).toContain("knownComponents");
  });

  it("случаи собираются механикой, а не разметкой", () => {
    const source = read("../src/showcase/cases.ts");

    expect(source).toContain("sketchOf");
    expect(source).toContain("updateNode");
  });
});
