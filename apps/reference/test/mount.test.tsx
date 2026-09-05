// Шов с зоной `solid` — точка 1 замороженной поверхности (`PROBEWEB-4`).
//
// Здесь проверяется не `mountApp()` сам по себе (это предмет тестов зоны `solid`), а СВЯЗКА
// «разметка приложения ↔ рантайм»: `index.html` кладёт `#root`, рантайм ищет его сам, и
// приложение об этой точке не знает. Ни один тип про такую связь ничего не знает — сломать
// её можно, не уронив ни компилятор, ни линтер.

import { mountApp } from "@web-core/solid/mount";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "../src/app";

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.classList.remove("dark");
});

/** Ставит точку монтирования ровно так, как её кладёт `index.html` приложения. */
function givenRoot(): void {
  document.body.innerHTML = '<div id="root"></div>';
}

describe("приложение поднимается рантаймом", () => {
  it("монтируется в #root, не получая точку монтирования аргументом", () => {
    givenRoot();

    mountApp(() => <App />);

    const app = document.querySelector("#root .app");
    expect(app).not.toBeNull();
    expect(document.querySelector('#root [data-slot="button"]')).not.toBeNull();
  });

  it("без #root падает внятно, а не в пустую страницу", () => {
    // Ровно этот случай ловит переименованный идентификатор в `index.html`: сборка при этом
    // остаётся зелёной, страница — пустой, и без внятного текста причину ищут в приложении.
    document.body.innerHTML = "<div id='app'></div>";

    expect(() => mountApp(() => <App />)).toThrowError(/#root/);
  });
});
