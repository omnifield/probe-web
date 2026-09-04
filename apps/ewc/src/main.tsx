import "@web-core/style/base.css";
import "./app.css";

import { mount } from "@web-core/shared";
import { makeSkinSwitch } from "@web-core/skin/wear";

import { App } from "./app.jsx";
import { SKIN_SOURCE } from "./skins.js";

const skin = makeSkinSwitch(SKIN_SOURCE);

// `mount` finds `#root` itself — see `index.html`.
mount(() => <App skin={skin} />);
