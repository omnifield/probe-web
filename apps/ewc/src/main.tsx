import "@omnifield/probe-web-style/base.css";
import "./app.css";

import { makeSkinSwitch, mount } from "@omnifield/probe-web-runtime";

import { App } from "./app.jsx";
import { SKIN_SOURCE } from "./skins.js";

const skin = makeSkinSwitch(SKIN_SOURCE);

// `mount` finds `#root` itself — see `index.html`.
mount(() => <App skin={skin} />);
