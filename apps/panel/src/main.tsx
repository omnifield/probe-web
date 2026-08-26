// THE PANEL HAS NO PALETTE, and that is not a gap. The dressed-up value set is off the shelf: a
// palette without recipes is half a skin, and a skin does not come in halves. The panel is a
// tool, has no skin, and never will — so it sets its own color itself, as literals, in `panel.css`.
//
// The reset and the size scales come from the base layer: they have fallbacks and work without a
// palette. Color roles are empty without one — the panel does not lean on them.
import "@omnifield/probe-web-style/base.css";
import "./panel.css";

import { render } from "solid-js/web";

import { Panel } from "./panel.jsx";

// THERE IS NO PRE-FIRST-FRAME RESTORE HERE ANYMORE, and that is not an oversight.
//
// It used to guard against a flash: mode was set before rendering, so nobody saw light before
// dark. There is nothing to set now — mode became half of a skin, and there is no skin on the
// first frame: the list arrives from the service later. There is nowhere for a flash to come
// from, because there is no look yet either.
//
// The restore lives in the panel, where the list is already known.

const root = document.getElementById("root");
if (!root) throw new Error("no #root — nowhere to mount the panel");

render(() => <Panel />, root);
