// Точка входа площадки. Состав вызовов тот же, что у эталона и у скелета потребителя:
// базовый CSS, тема, своё оформление, затем `mount` из зоны `runtime`.
//
// Третья строка — оформление ПЛОЩАДКИ: и кит, и конструктор фильтра безголовые, поэтому без
// неё страница поднимется, но останется неодетой.
import "@omnifield/probe-web-style/base.css";
import "@omnifield/probe-web-style/themes.css";
import "./playground.css";

import { mount } from "@omnifield/probe-web-runtime";

import { App } from "./app.jsx";

mount(() => <App />);
