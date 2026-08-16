// Гейт ОБЯЗАТЕЛЬСТВА по `data-slot` (`kb:PROBEWEB-12`, пункт 7).
//
// Зона `skin` цепляется за имена слотов, и на них держится всё её оформление. Обещание
// «имена не меняются и не исчезают без мажора» без проверки живёт ровно до первого
// переименования: исчезнувшая зацепка не ломает ни сборку, ни типы, ни один тест поведения —
// разметка остаётся валидной, а оформление у потребителя просто перестаёт применяться.
// Узнаёт об этом он сам, глазами, и уже после выпуска.
//
// Поэтому перечень стерегут С ДВУХ сторон, и обе стороны нужны:
//
//   1. КАЖДОЕ обещанное имя обязано появиться в живом документе. Удалили слот, переименовали
//      его, обменяли местами два имени — прогон краснеет и называет имя.
//   2. КАЖДАЯ зацепка из исходников обязана быть в перечне. Новый слот добавлять можно и без
//      мажора, но молча — нельзя: не попав в перечень, он не станет обещанием, и потребитель
//      будет цепляться за то, чего мы ему не обещали.
//
// Проверка первая — RENDER, как и весь предмет зоны: снятая с модуля зацепка не отличается
// от поставленной на узел. Проверка вторая читает исходники и потому живёт рядом, а не в
// сборочном прогоне: у обеих один предмет и один адрес, куда смотреть при красноте.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { Button } from "../src/button.jsx";
import { Field, FieldDescription, FieldError, Input, Label, Textarea } from "../src/field.jsx";
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
  SelectListbox,
  SelectPortal,
  SelectTrigger,
  SelectValue,
} from "../src/select.jsx";
import { Separator } from "../src/separator.jsx";
import { Spinner } from "../src/spinner.jsx";
import { Toggle } from "../src/toggle.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";
import { PROMISED_SLOTS } from "./slot-list.js";

afterEach(cleanup);

const CITIES = ["Москва", "Казань", "Пермь"];

/**
 * Сцена, в которой каждая зацепка зоны оказывается в документе одновременно.
 *
 * Два состояния здесь выставлены НАРОЧНО, потому что иначе их слотов в документе нет вовсе:
 * `validationState="invalid"` — иначе kobalte не рендерит сообщение об ошибке; выбранный
 * город — иначе не рендерится отметка выбранного варианта. Панель списка открывает сам тест:
 * до открытия её узлы живут в портале, которого ещё не существует.
 *
 * `Input` и `Textarea` стоят в РАЗНЫХ полях: у корня `Field` один идентификатор ввода на
 * поле, и два ввода в одном корне спорили бы за связку `for`↔`id`.
 */
function Scene() {
  return (
    <>
      <Button>Отправить</Button>
      <Toggle>Жирный</Toggle>
      <Separator />
      <Spinner />

      <Field validationState="invalid">
        <Label>Почта</Label>
        <Input type="email" />
        <FieldDescription>Куда придёт письмо</FieldDescription>
        <FieldError>Не похоже на адрес</FieldError>
      </Field>

      <Field>
        <Textarea />
      </Field>

      <Select<string>
        options={CITIES}
        placeholder="Город"
        value="Казань"
        itemComponent={(item) => (
          <SelectItem item={item.item}>
            <SelectItemLabel>{item.item.rawValue}</SelectItemLabel>
            <SelectItemIndicator>✓</SelectItemIndicator>
          </SelectItem>
        )}
      >
        <SelectTrigger>
          <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
          <SelectIcon>▾</SelectIcon>
        </SelectTrigger>
        <SelectPortal>
          <SelectContent>
            <SelectListbox />
          </SelectContent>
        </SelectPortal>
      </Select>
    </>
  );
}

/** Имена зацепок, реально доехавшие до документа, — без повторов и по алфавиту. */
function slotsInDocument(): string[] {
  const found = [...document.querySelectorAll("[data-slot]")].map(
    (node) => node.getAttribute("data-slot") as string,
  );

  return [...new Set(found)].sort();
}

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "..", "src");

/**
 * Зацепки, поставленные исходником.
 *
 * Комментарии срезаются: в доке компонентов `data-slot` стоит примерами CSS, и правило из
 * такого примера не является зацепкой — предмет здесь только атрибут в разметке.
 */
function slotsInSource(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  return [...code.matchAll(/data-slot="([^"]+)"/g)].map((match) => match[1]);
}

describe("обещанные зацепки доезжают до документа", () => {
  it("перечень в документе совпадает с обещанным — ровно, без лишних и без пропавших", () => {
    const host = mount(() => <Scene />);
    press(one(host, "[data-slot='select-trigger']"));

    // Сравнение РАВЕНСТВОМ, а не вхождением: «содержит обещанные» пропустило бы зацепку,
    // которую в перечень не внесли, и обещание разъехалось бы с поставкой в другую сторону.
    expect(slotsInDocument()).toEqual([...PROMISED_SLOTS].sort());
  });

  it("имён девятнадцать — счёт назван явно, чтобы правка перечня была видна", () => {
    // Число стоит в контракте зоны `skin` (`kb:PROBEWEB-11`) и в её фонде. Меняется оно —
    // меняется чужая зона, и это разговор, а не правка на месте.
    expect(PROMISED_SLOTS).toHaveLength(19);
    expect(new Set(PROMISED_SLOTS).size).toBe(19);
  });
});

describe("зацепки исходников не выходят за обещанное", () => {
  const sources = readdirSync(srcDir)
    .filter((name) => name.endsWith(".tsx"))
    .map((name) => ({ name, slots: slotsInSource(readFileSync(join(srcDir, name), "utf8")) }));

  it("файлов с примитивами найдено столько же, сколько их в зоне", () => {
    // Иначе перебор по пустому списку файлов был бы зелёным и ничего не проверял.
    expect(sources.length).toBeGreaterThanOrEqual(7);
  });

  for (const source of sources) {
    it(source.name, () => {
      for (const slot of source.slots) expect(PROMISED_SLOTS).toContain(slot);
    });
  }

  it("`Slot` не ставит зацепки — своего имени у него нет намеренно", () => {
    // Обратная сторона того же обещания: появись у него имя, потребитель начал бы за него
    // цепляться, а мы обещали бы то, что решает не зона (`src/slot.tsx`).
    const slot = sources.find((source) => source.name === "slot.tsx");

    expect(slot?.slots).toEqual([]);
  });
});
