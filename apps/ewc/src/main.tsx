import "./app.css";

import { render } from "solid-js/web";

import { App } from "./app.jsx";

const root = document.getElementById("root");
if (!root) throw new Error("no #root — nowhere to mount ewc");

render(() => <App />, root);
