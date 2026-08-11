// Render-тест, который прогоняется ПРЕСЕТОМ `/vitest` (`tasker:PROBEWEB-9`, Acceptance).
//
// Проверяется не «vitest запустился», а три вещи разом, и все три обеспечивает пресет:
//   • JSX трансформируется в раннере (плагин из пресета);
//   • `solid-js/web` разрешился в БРАУЗЕРНУЮ ветку — иначе `render()` падает
//     «Client-only API called on the server side» (условия из пресета);
//   • JSX из ЗАВИСИМОСТИ тоже трансформировался — условие `solid` дошло до неё.

import { render } from "solid-js/web";
import { DepGreeting } from "probe-web-build-fixture-jsx-dep";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("пресет /vitest", () => {
  it("рендерит свой JSX в документ", () => {
    const host = document.createElement("div");
    document.body.append(host);

    render(() => <p data-testid="own">свой</p>, host);

    expect(host.querySelector<HTMLElement>('[data-testid="own"]')?.textContent).toBe("свой");
  });

  it("рендерит JSX, приехавший из зависимости", () => {
    const host = document.createElement("div");
    document.body.append(host);

    render(() => <DepGreeting text="из зависимости" />, host);

    const node = host.querySelector<HTMLElement>('em[data-testid="dep-greeting"]');
    expect(node).not.toBeNull();
    expect(node?.textContent).toBe("из зависимости");
  });
});
