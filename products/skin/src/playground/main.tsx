// Точка входа стенда. Порядок тот же, что у соседей и у скелета потребителя: базовый CSS,
// тема, оформление СТЕНДА, затем `mount` из зоны `runtime`.
//
// Чего здесь намеренно НЕТ — импорта нашего оформления кита (`skin.css`). Стенд подключает и
// снимает его на живую (`app.tsx`), потому что показать надо именно это: подключается отдельно
// и снимается отдельно, кит без него остаётся голым (kb:PROBEWEB-11, правило первое).
import "@omnifield/probe-web-style/base.css";
import "@omnifield/probe-web-style/themes.css";
import "./playground.css";

import { mount } from "@omnifield/probe-web-runtime";

import { App } from "./app.jsx";

mount(() => <App />);
