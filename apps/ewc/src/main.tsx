import "@web-core/style/base.css";
import "./app.css";

import { mountApp } from "@web-core/solid/mount";
import { makeSkinSwitch } from "@web-core/skin/wear";

import { App } from "./app.jsx";
import { SKIN_SOURCE } from "./skins.js";

const skin = makeSkinSwitch(SKIN_SOURCE);

// `mountApp` finds `#root` itself — see `index.html`.
mountApp(() => <App skin={skin} />);
