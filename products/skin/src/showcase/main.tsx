// Точка входа витрины.
//
// Порядок тот же, что у скелета потребителя: набор значений, тема, вид САМОЙ витрины, затем
// `mount` из зоны `runtime`.
//
// Чего здесь намеренно НЕТ — импорта оформления кита. Скин надевается и снимается на живую
// механикой приложения, и показать надо именно это: без скина кит остаётся голым
// (`kb:PROBEWEB-11`, правило первое). Пока скина в зоне нет вовсе — витрина честно показывает
// голое.

import "@omnifield/probe-web-style/base.css";
import "@omnifield/probe-web-style/themes.css";
import "./showcase.css";

import { mount } from "@omnifield/probe-web-runtime";

import { App } from "./app.jsx";

mount(() => <App />);
