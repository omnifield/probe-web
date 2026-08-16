// ВТОРАЯ ПОЛОВИНА пробы «кит без skin остаётся голым» — рендер примитива в настоящий документ.
//
// НЕ ЗАПУСКАЕТСЯ, и причина не в пробе. Пресет тестов из зоны `build` (точка 4 замороженной
// поверхности) не разрешает `.jsx`, который `@kobalte/core` отдаёт по условию `solid`:
//
//     TypeError: Unknown file extension ".jsx" for
//     …/@kobalte/core/dist/button/index.jsx
//
// Это дефект пресета, а не нашей зоны: пресет предназначен ПОТРЕБИТЕЛЮ, а любой потребитель
// нашей базы рендерит примитивы кита — иначе тестировать ему нечего. Зона `ui` свои примитивы
// рендерит успешно, но своим конфигом: она пресетом не пользуется и пользоваться не вправе
// (`kb:PROBEWEB-4`, направление зависимостей).
//
// ПОЧЕМУ НЕТ ПОДПОРКИ. Одна строка в нашем `vitest.config.ts` (инлайн зависимости) прогон бы
// починила — и спрятала бы поломку от всех, кто соберётся после нас. Зона `products/` своей
// оснастки не заводит, а находка про базу идёт заявкой к architect (`kb:PROBEWEB-5`).
//
// Заявка отдана; проба лежит написанной и включается снятием `.skip` — работы там ноль.

// Кит подтягивается ВНУТРИ проб, а не на верхнем уровне: при статическом импорте файл падал
// бы на загрузке ещё до того, как `describe.skip` успеет сработать, и красным был бы весь
// прогон зоны. Снимаем `.skip` — импорты остаются на месте и работают как обычно.
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

const kit = () => import("@omnifield/probe-web-ui");

const disposers: Array<() => void> = [];

function mount(code: Parameters<typeof render>[0]) {
  const host = document.createElement("div");
  document.body.append(host);
  disposers.push(render(code, host));
  return host;
}

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.innerHTML = "";
});

describe.skip("кит без skin остаётся голым (рендер)", () => {
  it("ни один примитив не несёт класса или инлайнового стиля", async () => {
    const { Button, Field, Input, Label, Toggle } = await kit();
    const host = mount(() => (
      <>
        <Button>Кнопка</Button>
        <Toggle>Переключатель</Toggle>
        <Field>
          <Label>Метка</Label>
          <Input />
        </Field>
      </>
    ));

    const dressed = [...host.querySelectorAll("[data-slot]")].filter(
      (node) => node.getAttribute("class") ?? node.getAttribute("style"),
    );

    expect(
      dressed.map((n) => `${n.getAttribute("data-slot")}: class=${n.getAttribute("class")}`),
      "примитив приехал с оформлением, хотя skin не подключён",
    ).toEqual([]);
  });

  it("зацепки на месте — голый не значит безымянный", async () => {
    // Обратная сторона той же пробы: «ничего нет» не должно означать «не за что цепляться».
    const { Button } = await kit();
    const host = mount(() => <Button>Кнопка</Button>);

    expect(host.querySelector('[data-slot="button"]')).not.toBeNull();
  });

  it("в документе нет ни одной таблицы стилей от нас", async () => {
    const { Button } = await kit();
    mount(() => <Button>Кнопка</Button>);
    const injected = [...document.querySelectorAll("style, link[rel=stylesheet]")];

    expect(injected.length, "в документе появились стили без явного подключения").toBe(0);
  });
});
