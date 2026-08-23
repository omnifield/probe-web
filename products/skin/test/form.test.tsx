// ЭКРАН ФОРМЫ — правка по координате и её путь до службы (`PWEB-31`).
//
// Проверяются четыре обещания, без которых редактор врёт человеку:
//
//   1. части и состояния берутся из ПАСПОРТА, а не из перечня редактора;
//   2. правка видна СРАЗУ и тем же путём, каким видно сохранённое, — надеванием черновика;
//   3. сохранённое доезжает до службы целиком и заменяет прежнюю запись, а не ложится рядом;
//   4. унаследованное отличимо от пустого — иначе человек пишет заново то, что уже сказано.
//
// Чего здесь нет: проверки, что «стало красиво». Вид проверяет человек, а машина — что правка
// доехала туда, куда обещано, и ровно в том виде.

import { passportOf } from "@omnifield/probe-web-ui/passport";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/showcase/app.jsx";

import { cleanup, mount } from "./dom.jsx";
import { FORM, OUTFIT, PALETTE } from "./fixtures.js";
import { restoreStore, serveLook, storedNow } from "./store-stub.js";

beforeEach(() => serveLook({ palettes: [PALETTE], forms: [FORM], outfits: [OUTFIT] }));

afterEach(() => {
  restoreStore();
  cleanup();
  document.documentElement.removeAttribute("data-skin");
  for (const sheet of document.querySelectorAll("style")) sheet.remove();
  localStorage.clear();
});

/** Открывает вид «форма» и дожидается, пока черновик приедет из службы. */
async function openForm(): Promise<HTMLElement> {
  const host = mount(() => <App />);
  const [, форма] = [...host.querySelectorAll<HTMLButtonElement>(".views__item")];

  форма?.click();

  await vi.waitFor(() => expect(host.querySelectorAll(".prop").length).toBeGreaterThan(0));

  return host;
}

/** Строка свойства по имени — то, что человек видит и правит. */
function rowOf(host: HTMLElement, name: string): HTMLElement | undefined {
  return [...host.querySelectorAll<HTMLElement>(".prop")].find(
    (строка) => строка.querySelector(".prop__name")?.textContent === name,
  );
}

describe("что показано", () => {
  it("части приходят из паспорта, своего перечня у редактора нет", async () => {
    const host = await openForm();
    const названо = [...host.querySelectorAll(".form__part-name")].map(
      (узел) => узел.textContent ?? "",
    );

    expect(названо).toEqual([...(passportOf("button")?.anatomy.keys() ?? [])]);
  });

  it("состояния в выборе — тоже паспортные", async () => {
    const host = await openForm();
    const options = [...host.querySelectorAll(".form__coords option")].map(
      (узел) => узел.textContent ?? "",
    );

    for (const состояние of passportOf("button")?.parts[0]?.states ?? []) {
      expect(options).toContain(состояние.name);
    }
  });

  it("вариации в выборе — из ЗАПИСИ, потому что имена принадлежат скину", async () => {
    const host = await openForm();
    const options = [...host.querySelectorAll(".form__coords option")].map(
      (узел) => узел.textContent ?? "",
    );

    for (const имя of Object.keys(FORM.recipe.variants ?? {})) expect(options).toContain(имя);
    // Паспорт имён не знает и знать не должен — обратная сторона того же.
    expect(JSON.stringify(passportOf("button"))).not.toContain("главная");
  });

  it("написанное на координате отделено от пришедшего от базы", async () => {
    const host = await openForm();

    // База кнопки в фикстуре объявляет фон и цвет — они свои, со снятием.
    expect(rowOf(host, "background")?.className).not.toContain("prop--inherited");

    const [вариация] = [...host.querySelectorAll<HTMLSelectElement>(".form__coords select")];
    вариация!.value = "главная";
    вариация!.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      // В вариации объявлены фон и цвет; скругление приходит от базы — оно показано бледным и
      // без кнопки снятия: снимать здесь нечего, сказано это в другом месте.
      expect(rowOf(host, "borderRadius")?.className).toContain("prop--inherited");
      expect(rowOf(host, "borderRadius")?.querySelector(".prop__drop")).toBeNull();
    });

    expect(rowOf(host, "background")?.className).not.toContain("prop--inherited");
  });
});

describe("правка", () => {
  it("одевает показ ЧЕРНОВИКОМ — тем же путём, каким одевается сохранённое", async () => {
    const host = await openForm();
    const поле = rowOf(host, "background")?.querySelector<HTMLInputElement>(".prop__value");

    поле!.value = "var(--акцент-9)";
    поле!.dispatchEvent(new Event("change", { bubbles: true }));

    // Опознание на корне — свидетельство того, что правка проехала сборку и порождение, а не
    // легла стилем на узел: стиль на узле корня не трогает вовсе.
    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute("data-skin")).toBe("draft"),
    );

    const лист = [...document.querySelectorAll("style")].map((узел) => узел.textContent).join("");

    expect(лист).toContain("var(--акцент-9)");
  });

  it("снятое свойство уходит из показа", async () => {
    const host = await openForm();

    rowOf(host, "color")?.querySelector<HTMLButtonElement>(".prop__drop")?.click();

    await vi.waitFor(() => expect(rowOf(host, "color")).toBeUndefined());
  });
});

describe("сохранение", () => {
  it("кладёт правку в службу вместо прежней записи, а не рядом", async () => {
    const host = await openForm();
    const поле = rowOf(host, "background")?.querySelector<HTMLInputElement>(".prop__value");

    поле!.value = "var(--акцент-9)";
    поле!.dispatchEvent(new Event("change", { bubbles: true }));

    host.querySelector<HTMLButtonElement>(".form__button--main")?.click();

    await vi.waitFor(() => {
      const формы = storedNow().filter((запись) => запись.kind === "form");

      // Ровно одна: две записи одного имени оставили бы решение «какая поедет в наряд» за
      // порядком перечня, то есть за случайностью.
      expect(формы).toHaveLength(1);
      expect(JSON.stringify(формы[0]?.state)).toContain("var(--акцент-9)");
    });
  });

  it("после сохранения человек остаётся в правке, а не переодевается", async () => {
    const host = await openForm();

    host.querySelector<HTMLButtonElement>(".form__button--main")?.click();

    // Сохранённая запись РАВНА черновику, которым одет показ: переодевание на наряд мигнуло бы
    // экраном и вернулось к тому же виду, сообщив о работе, которой не было.
    await vi.waitFor(() =>
      expect(storedNow().filter((запись) => запись.kind === "form")).toHaveLength(1),
    );

    expect(document.documentElement.getAttribute("data-skin")).toBe("draft");
    expect(host.querySelectorAll(".prop").length).toBeGreaterThan(0);
  });

  it("уход из правки возвращает показ на наряд", async () => {
    const host = await openForm();
    const [витрина] = [...host.querySelectorAll<HTMLButtonElement>(".views__item")];

    витрина?.click();

    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute("data-skin")).toBe(OUTFIT.name),
    );
  });
});
