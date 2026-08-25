// НАСТОЯЩИЙ КИТ В ЖИВОМ БРАУЗЕРЕ — общее для всех гейтов, замеряющих кит в Chromium (`PWEB-111`).
//
// Перенесено построчно из `packages/skin-reference/test/helpers/kit.ts` (снесённый пакет,
// git-история цела на `git show 5d560ae:packages/skin-reference/test/helpers/kit.ts`). Прежде
// жило в СОСЕДНЕМ пакете и резолвило `@omnifield/probe-web-ui` как чужую зависимость; теперь
// живёт ВНУТРИ него самого и резолвит себя тем же именем — самоссылка пакета на себя (Node,
// `exports` в `package.json`) работает одинаково что изнутри, что снаружи, и правкой не была.
//
// Общее на несколько гейтов, а не в папке одного компонента: помощник не знает имени «accordion»
// нигде в себе, кроме примера в комментарии, — общее место для этого и есть `test/`
// (тот же довод, что у `test/dom.jsx`, `test/palette.ts`, `test/skin.ts`).

import { ask, type Call } from "@omnifield/live-check";
import { PASSPORTS } from "@omnifield/probe-web-ui/passport";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { dirname } from "node:path";

const require = createRequire(import.meta.url);

/** Адрес части — из анатомии кита, руками селекторы не пишем. */
export function координата(component: string, part: string): string {
  const attrs = PASSPORTS[component]!.anatomy.build()[part]!.attrs as Record<string, string>;

  return Object.entries(attrs)
    .map(([имя, значение]) => `[${имя}="${значение}"]`)
    .join("");
}

/**
 * Собирает кит из поставки НА МЕСТЕ — не слепком рядом.
 *
 * Точка входа берёт `solid-js` ТЕМ ЖЕ разрешением, что и сам кит: она собирается из папки его
 * поставки. Своей зависимости на реактивность зона не заводит.
 *
 * Разметку рисует ОБЪЯВЛЕННАЯ КИТОМ сборка (`assembly` паспорта), а части — из карты кита
 * (`KIT`). Своей разметки гейт не пишет: написанная им, она проверяла бы наше представление о
 * ките, а не кит.
 *
 * @param component имя компонента — ключ `KIT` и `data-scope`
 * @param доп пропы, которых сборка сама не называет, — например `orientation`. Кладутся на
 *   КОРЕНЬ и только на него: сборка про них не знает, а это ровно то, что потребитель добавил бы
 *   сам, не трогая ни кита, ни паспорт
 */
export async function собратьКит(
  component: string,
  доп: Readonly<Record<string, unknown>> = {},
): Promise<string> {
  const вход = require.resolve("@omnifield/probe-web-ui");
  const точка = `
    import { render, createComponent } from "solid-js/web";
    import { KIT } from ${JSON.stringify(вход)};

    const { passport, parts } = KIT[${JSON.stringify(component)}];

    const рисовать = (узел) =>
      "genus" in узел
        ? узел.value
        : createComponent(parts[узел.part], {
            ...узел.props,
            ...(узел.part === passport.root ? ${JSON.stringify(доп)} : {}),
            get children() {
              return (узел.children ?? []).map(рисовать);
            },
          });

    render(() => рисовать(passport.assembly.tree), document.getElementById("корень"));
    window.__собрано = true;
  `;

  const собрано = await build({
    stdin: { contents: точка, resolveDir: dirname(вход), loader: "js" },
    bundle: true,
    format: "iife",
    platform: "browser",
    // Условие `solid` НЕ спрашиваем: оно отдаёт непреобразованный JSX, а трансформации у нас
    // здесь нет. Берём ветку `default` — ту же, которой пользуется потребитель без Solid-сборки.
    conditions: ["browser", "import", "default"],
    write: false,
    logLevel: "silent",
  });

  return собрано.outputFiles[0]!.text;
}

/** Страница: место для листа скина и корень, в который кит рисует свою сборку. */
export const СТРАНИЦА =
  '<!doctype html><html><head><style id="скин"></style></head>' +
  '<body><div id="корень"></div></body></html>';

/**
 * Настоящий тычок указателем по УЗЛУ СПИСКА — координаты снимаются ЗАНОВО перед каждым вызовом.
 *
 * Оплачено при разработке первого гейта: раскрытие двигает раскладку, и второй тычок по
 * координатам, снятым до первого, попадает мимо кнопки. Промах МОЛЧАЛИВЫЙ — состояние просто не
 * меняется, — и снятые здесь координаты живут ровно один вызов.
 *
 * @param selectorAll селектор списка узлов, `querySelectorAll`
 * @param index индекс узла в списке
 */
export async function тык(call: Call, selectorAll: string, index: number): Promise<void> {
  const где = JSON.parse(
    await ask(
      call,
      `JSON.stringify(document.querySelectorAll('${selectorAll}')[${index}].getBoundingClientRect())`,
    ),
  ) as { x: number; y: number; width: number; height: number };

  const точка = { x: Math.round(где.x + где.width / 2), y: Math.round(где.y + где.height / 2) };

  for (const type of ["mousePressed", "mouseReleased"] as const) {
    await call("Input.dispatchMouseEvent", {
      ...точка,
      type,
      button: "left",
      clickCount: 1,
      buttons: type === "mousePressed" ? 1 : 0,
    });
  }
}

/** Одна анимация, как её видит Web Animations API. */
export interface ЖивоеДвижение {
  readonly name: string | null;
  readonly duration: number | string | null;
  readonly playState: string;
}

/**
 * ДВИЖЕНИЯ, идущие на узлах СЕЙЧАС — спрошено у браузера, а не сосчитано по кадрам.
 *
 * `getAnimations()` отвечает про СОСТОЯНИЕ анимации, а не про то, сколько раз мы успели её
 * опросить, — устойчиво к нагрузке воркспейса, в отличие от подсчёта кадров своим поллером.
 *
 * Зовётся СРАЗУ после тычка, без единого кадра ожидания: Web Animations API регистрирует
 * анимацию в том же обороте событий, что и клик.
 *
 * @param selectorAll селектор узлов, `querySelectorAll`
 */
export async function движенияНа(call: Call, selectorAll: string): Promise<ЖивоеДвижение[][]> {
  return JSON.parse(
    await ask(
      call,
      `(() => JSON.stringify([...document.querySelectorAll('${selectorAll}')].map((узел) =>
        узел.getAnimations().map((a) => ({
          name: a.animationName,
          duration: a.effect?.getTiming().duration ?? null,
          playState: a.playState,
        })),
      )))()`,
    ),
  ) as ЖивоеДвижение[][];
}
