// The dev panel's own Vite config (`PWEB-124`).
//
// NO PROXY. `apps/panel/src/panel.tsx` points its iframe straight at each product's own dev
// server port (`http://localhost:5174` for skin). Proxying through this app's own dev server was
// tried and measured slower than a direct connection — confirmed live: opening the skin product's
// port directly loaded fast, the same content through a proxy hop did not. The premise a proxy
// would have solved ("only one port reaches the browser") does not hold here: every product's own
// port is already reachable directly, so there is nothing to route around.
//
// This file is therefore the same three lines every other app in the workspace has.
import { defineConfig } from "@web-core/build/vite";

export default defineConfig();
