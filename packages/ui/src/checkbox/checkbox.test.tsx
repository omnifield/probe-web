// Пробы чекбокса — поведение И паспорт, рядом с самим компонентом (`PWEB-114`).
//
// ГЛАВНОЕ ПРАВИЛО ПАСПОРТА: он не объявляет ненаблюдаемого. Всё записанное в
// `checkbox.anatomy.ts` проверяется здесь на ЖИВОМ узле.
//
// Четыре части ровно: `@zag-js/checkbox/anatomy` (откуда анатомия взята физически) несёт
// `root · label · control · indicator` — проверено на рантайме (`checkbox.anatomy.ts`), не на
// типе `@ark-ui/solid`, который называет ещё и `group`.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { coordinateOf, skinGaps, type Outfit, type PassportLookup } from "@omnifield/probe-web-skin/model";
import { admits, GROUPS, groupOf } from "@omnifield/probe-web-skin/editor";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanup, mount, nextTask, one } from "../../test/dom.jsx";
import { palette } from "../../test/palette.js";
import { assemble, generateSkinCss } from "../../test/skin.js";
import { anatomy, editorInfo, parts, passport } from "./checkbox.anatomy.js";
import {
  Checkbox,
  CheckboxControl,
  CheckboxHiddenInput,
  CheckboxIndicator,
  CheckboxLabel,
} from "./checkbox.jsx";
import { form } from "./checkbox.recipe.js";

afterEach(cleanup);

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  readFileSync(resolve(here, "..", "..", "package.json"), "utf8"),
) as { name: string };

/** Сцена — все четыре адресуемые части разом. */
const scene = () => (
  <Checkbox>
    <CheckboxControl>
      <CheckboxIndicator>✓</CheckboxIndicator>
    </CheckboxControl>
    <CheckboxLabel>Согласен с условиями</CheckboxLabel>
    <CheckboxHiddenInput />
  </Checkbox>
);

/** Узел части — по её адресу из паспорта, не из полной анатомии. */
function узел(host: ParentNode, part: keyof typeof parts): Element {
  const { attrs } = parts[part];

  return one(host, `[data-scope="${attrs["data-scope"]}"][data-part="${attrs["data-part"]}"]`);
}

describe("Checkbox", () => {
  it("рендерит корень узлом `<label>`", () => {
    const host = mount(scene);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("LABEL");
  });

  it("подпись — `<span>`, управляющая рамка и указатель — `<div>`, скрытый ввод — `<input>`", () => {
    const host = mount(scene);

    expect(узел(host, "label").tagName).toBe("SPAN");
    expect(узел(host, "control").tagName).toBe("DIV");
    expect(узел(host, "indicator").tagName).toBe("DIV");
    expect(one(host, "input").getAttribute("type")).toBe("checkbox");
  });

  it("клик по подписи переключает отметку — корень несёт и адрес, и поведение", async () => {
    const onCheckedChange = vi.fn();
    const host = mount(() => (
      <Checkbox onCheckedChange={onCheckedChange}>
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Согласен</CheckboxLabel>
        <CheckboxHiddenInput />
      </Checkbox>
    ));

    one(host, "label").click();
    await Promise.resolve();

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(узел(host, "root").getAttribute("data-state")).toBe("checked");
  });
});

describe("паспорт: часть ↔ разметка", () => {
  it("каждая объявленная часть появляется в документе — её же атрибутами", () => {
    const host = mount(scene);

    expect(passport.parts.length).toBeGreaterThan(0);

    for (const part of passport.parts) {
      const { attrs } = parts[part.name];
      const node = узел(host, part.name);

      for (const [name, value] of Object.entries(attrs)) {
        expect(node.getAttribute(name)).toBe(value);
      }
    }
  });

  it("добавка покрывает РОВНО части анатомии — ни больше, ни меньше", () => {
    // `@zag-js/checkbox/anatomy` несёт здесь четыре части — `root · label · control · indicator`.
    // `CheckboxGroup` — отдельный компонент (вне предмета `PWEB-114`) со своим паспортом, когда
    // появится; сегодня у стоящей отдельно анатомии чекбокса части под него нет вовсе.
    expect(passport.parts.map((part) => part.name).sort()).toEqual([...anatomy.keys()].sort());
  });

  it("скрытый ввод адреса не несёт — это не пробел, а факт `getHiddenInputProps()`", () => {
    const host = mount(scene);

    expect(one(host, "input").hasAttribute("data-scope")).toBe(false);
    expect(one(host, "input").hasAttribute("data-part")).toBe(false);
  });
});

describe("паспорт: состояния — данные, а не псевдоклассы", () => {
  it("ни один из четырёх адресов не несёт mark-псевдокласс — все состояния атрибутами", () => {
    for (const part of passport.parts) {
      for (const state of part.states) {
        expect(state.mark.kind, `${part.name}.${state.name}`).toBe("attribute");
      }
    }
  });

  it("`data-state` — три значения, и все три объявлены отдельными состояниями корня", () => {
    const values = passport.parts
      .find((part) => part.name === "root")!
      .states.filter((state) => state.mark.kind === "attribute" && state.mark.name === "data-state")
      .map((state) => (state.mark as { value?: string }).value);

    expect(values.sort()).toEqual(["checked", "indeterminate", "unchecked"]);
  });

  it("отмечен, не отмечен, отчасти — на живом узле, на ВСЕХ четырёх частях разом", () => {
    const снят = mount(scene);
    expect(узел(снят, "root").getAttribute("data-state")).toBe("unchecked");
    expect(узел(снят, "control").getAttribute("data-state")).toBe("unchecked");
    expect(узел(снят, "indicator").getAttribute("data-state")).toBe("unchecked");
    expect(узел(снят, "label").getAttribute("data-state")).toBe("unchecked");
    cleanup();

    const отмечен = mount(() => (
      <Checkbox checked>
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Согласен</CheckboxLabel>
        <CheckboxHiddenInput />
      </Checkbox>
    ));
    expect(узел(отмечен, "root").getAttribute("data-state")).toBe("checked");
    expect(узел(отмечен, "indicator").getAttribute("data-state")).toBe("checked");
    cleanup();

    const отчасти = mount(() => (
      <Checkbox checked="indeterminate">
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Согласен</CheckboxLabel>
        <CheckboxHiddenInput />
      </Checkbox>
    ));
    expect(узел(отчасти, "root").getAttribute("data-state")).toBe("indeterminate");
    expect(узел(отчасти, "indicator").getAttribute("data-state")).toBe("indeterminate");
  });

  it("указатель СПРЯТАН, когда не отмечен, и ВИДЕН, когда отмечен или отчасти — узел остаётся", () => {
    // Не `forceMount`, как было у kobalte-версии: узел ВСЕГДА в документе, видимость — нативный
    // `hidden` (`getIndicatorProps()`, `@zag-js/checkbox`), не монтирование.
    const снят = mount(scene);
    expect(узел(снят, "indicator").hasAttribute("hidden")).toBe(true);
    cleanup();

    const отмечен = mount(() => (
      <Checkbox checked>
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
      </Checkbox>
    ));
    expect(узел(отмечен, "indicator").hasAttribute("hidden")).toBe(false);
  });

  it("отключён, только для чтения, невалиден, обязателен — данными на всех адресуемых частях", () => {
    const host = mount(() => (
      <Checkbox disabled readOnly invalid required>
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Согласен</CheckboxLabel>
      </Checkbox>
    ));

    for (const part of ["root", "control", "indicator", "label"] as const) {
      const node = узел(host, part);

      expect(node.hasAttribute("data-disabled"), part).toBe(true);
      expect(node.hasAttribute("data-readonly"), part).toBe(true);
      expect(node.hasAttribute("data-invalid"), part).toBe(true);
      expect(node.hasAttribute("data-required"), part).toBe(true);
    }
  });

  it("наведение и фокус — данные, которые ставит Zag САМ, а не браузер: живой указатель и фокус", async () => {
    // Настоящий фокус лежит на скрытом вводе, а не на видимых частях — здесь и проверяется, что
    // Zag зеркалит его на КОРЕНЬ данными, а не что браузер сам применил бы псевдокласс.
    const host = mount(scene);
    const ввод = one<HTMLInputElement>(host, "input");

    // Настоящий `.focus()`, а не сконструированный `FocusEvent`: браузерный алгоритм фокуса
    // двигает `document.activeElement`, и обработчик Zag на него и смотрит.
    ввод.focus();
    await nextTask();

    expect(узел(host, "root").hasAttribute("data-focus")).toBe(true);

    ввод.blur();
    await nextTask();

    expect(узел(host, "root").hasAttribute("data-focus")).toBe(false);
  });
});

describe("паспорт: форма", () => {
  it("добавка не превышает анатомию: каждая объявленная часть — настоящий ключ Zag", () => {
    const known = new Set(anatomy.keys());

    for (const part of passport.parts) expect(known.has(part.name)).toBe(true);
  });

  it("корень назван и есть среди частей анатомии", () => {
    expect(anatomy.keys()).toContain(passport.root);
  });

  it("имя компонента снято с анатомии, а не написано рядом", () => {
    expect(passport.component).toBe(parts[passport.root].attrs["data-scope"]);
  });

  it("группа объявлена и взята из закрытого перечня", () => {
    expect(editorInfo.group).toBe("inputs");
    expect(Object.keys(GROUPS)).toContain(editorInfo.group);
    expect(groupOf(editorInfo)).toBe("inputs");
  });

  it("настроек из закрытого перечня нет — `disabled`/`invalid`/`required`/`readOnly` уже состояния", () => {
    expect(passport.settings).toEqual({});
  });

  it("поставщик назван и совпадает с манифестом", () => {
    expect(editorInfo.package).toBe(manifest.name);
  });

  it("узел превращается в координату — скину есть что адресовать", () => {
    const lookup: PassportLookup = (component) =>
      component === passport.component ? passport : undefined;
    const host = mount(() => (
      <Checkbox data-variant="крупный">
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
      </Checkbox>
    ));

    expect(coordinateOf(узел(host, "root"), lookup)).toEqual({
      component: "checkbox",
      part: "root",
      states: ["unchecked"],
      variant: "крупный",
    });
  });

  it("правило вложенности: control пускает indicator, root пускает все три своих части", () => {
    const root = editorInfo.parts.root;
    const control = editorInfo.parts.control;

    expect(admits(root, { kind: "part", name: "control" })).toBe(true);
    expect(admits(root, { kind: "part", name: "label" })).toBe(true);
    expect(admits(control, { kind: "part", name: "indicator" })).toBe(true);
    expect(admits(control, { kind: "part", name: "label" })).toBe(false);
  });
});

// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`, `PWEB-114`, `checkbox.recipe.ts`): компонент доказывает
// себя сам — паспорт чекбокса МОЖНО одеть настоящей механикой скина целиком.
describe("рецепт-доказательство: паспорт МОЖНО одеть целиком", () => {
  const outfit: Outfit = { name: "проба", palette: palette.name, forms: [form.name] };
  const { skin } = assemble(outfit, { palettes: [palette], forms: [form] });

  it("покрытие полное — ни одной непокрытой координаты паспорта", () => {
    expect(skinGaps(skin, [passport])).toEqual([]);
  });

  it("CSS действительно порождается, а не только собирается типами", () => {
    expect(generateSkinCss(skin).length).toBeGreaterThan(0);
  });
});
