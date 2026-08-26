import "@omnifield/probe-web-style/base.css";
import "./app.css";

import { mount } from "@omnifield/probe-web-runtime";

import { App } from "./app.jsx";
import { EWC_SKIN, makeEwcSkin } from "./skin.js";

// `remember: false` — this is the app's own fixed skin, not a choice a person made (same
// reasoning as `apps/reference/src/skin.ts`'s `dressApp()`).
const skin = makeEwcSkin();
void skin.wear(EWC_SKIN.name, { mode: "light", remember: false });

// `mount` finds `#root` itself — see `index.html`.
mount(() => <App skin={skin} />);
