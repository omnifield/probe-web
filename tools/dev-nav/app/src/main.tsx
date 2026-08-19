// Порядок подключения НЕСУЩИЙ: слой ролей → ступени палитры → оформление кита.
// Пресет ФАЙЛОМ здесь не подключается: сохранённые пресеты живут в службе, и панель собирает
// их вид из модели генератором базы (`themeModelToCss`), а не читает готовым файлом.
import "@omnifield/probe-web-style/base.css";
import "@omnifield/probe-web-style/themes.css";
import "@probe-web/skin/skin.css";
import "./panel.css";

import { restoreSkin } from "@omnifield/probe-web-runtime";
import { DEFAULT_PALETTE } from "@omnifield/probe-web-style";
import { render } from "solid-js/web";

import { Panel } from "./panel.jsx";

// НАЗВАННОЕ МЕСТО — то же, что в скелете потребителя (`packages/starter/template/main.tsx`).
// С `kb:PROBEWEB-18` палитра цепляется к документу только по ИМЕНИ: документ, её не назвавший,
// выходит нецветным. Стоит здесь, а не в `onMount` панели: режим, поставленный после первого
// кадра, даёт вспышку светлой темы перед тёмной (`kb:SKIN-7`, инвариант 3).
//
// Перечень — одна база: сохранённые пресеты приезжают из службы позже, и восстановление
// повторяется в панели, когда список известен.
restoreSkin({ presets: [DEFAULT_PALETTE], fallback: { preset: DEFAULT_PALETTE, mode: "dark" } });

const root = document.getElementById("root");
if (!root) throw new Error("нет #root — панель монтировать некуда");

render(() => <Panel />, root);
