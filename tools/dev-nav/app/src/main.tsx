// Порядок подключения НЕСУЩИЙ: слой ролей → ступени палитры → оформление кита.
// Пресет здесь не подключается намеренно (см. index.html).
import "@omnifield/probe-web-style/base.css";
import "@omnifield/probe-web-style/themes.css";
import "@probe-web/skin/skin.css";
import "./panel.css";

import { render } from "solid-js/web";

import { Panel } from "./panel.jsx";

const root = document.getElementById("root");
if (!root) throw new Error("нет #root — панель монтировать некуда");

render(() => <Panel />, root);
