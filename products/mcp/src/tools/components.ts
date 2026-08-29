// Интроспекция паспорта кита — `list_components`/`get_component_passport` (ТЗ `PWEB-117`, п.2).
//
// `PASSPORTS`/`passportOf` берутся из `@omnifield/probe-web-ui/passport` — тем же подпутём,
// который сам кит держит именно для чтения БЕЗ Solid и без браузера (см. шапку `passport.ts`
// в `packages/ui`). Паспорт не переизобретается: инструмент отдаёт его как есть, JSON-ом.
//
// Форма сборок (`PassportAssembly`) сюда сознательно НЕ включена: сегодня она не приезжает ни
// на одном настоящем компоненте кита (`defineEditorInfo` используется только в фикстурах
// `packages/skin/test/passports.ts`) — конкретные сборки-шаблоны для агента-генератора остаются
// отдельной, уже идущей заявкой (`PWEB-115`/`PWEB-116`), ТЗ явно выводит их за рамки каркаса.
// Когда сборки появятся у настоящего компонента, читать их сюда — `PassportAssembly` из
// `@omnifield/probe-web-skin/editor`, тем же способом: как источник правды, без пересборки.

import { PASSPORTS, passportOf } from "@omnifield/probe-web-ui/passport";
import { z } from "zod";

import { defineMcpTool } from "../types.js";

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

/** Имена всех компонентов кита, паспорт которых можно снять `get_component_passport`. */
export const listComponentsTool = defineMcpTool({
  name: "list_components",
  description:
    "Перечень компонентов кита probe-web по имени (data-scope), паспорт которых можно снять get_component_passport.",
  inputSchema: {},
  handler: () => json({ components: Object.keys(PASSPORTS) }),
});

/** Паспорт одного компонента — источник правды, инструмент его не переизобретает. */
export const getComponentPassportTool = defineMcpTool({
  name: "get_component_passport",
  description: "Паспорт компонента кита probe-web по имени: части анатомии, состояния, настройки, оси вариаций.",
  inputSchema: {
    component: z.string().describe("Имя компонента — то же, что data-scope и ключ в list_components"),
  },
  handler: ({ component }) => {
    const passport = passportOf(component);
    if (!passport) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: `Компонента «${component}» в ките нет. Список — list_components.` }],
      };
    }
    return json(passport);
  },
});
