// Dev panel: the one place to walk through products (`PWEB-124`).
//
// SCOPE RIGHT NOW: shows the skin product, nothing else — user decision 2026-08-26. Tables and
// other products join later as more tabs, each pointing at its own dev-server port the same way.
//
// EACH PRODUCT'S IFRAME POINTS STRAIGHT AT ITS OWN PORT, no proxy in between. A proxy through
// this app's own dev server was tried and measured slower live: the same content loaded fast on
// its own port and slow through the extra hop. There is also no "only one port reaches the
// browser" constraint to route around here — every product's port is already reachable directly.
//
// NO LIVENESS POLLING, NO SWITCHING STATE (yet): with one product there is nothing to switch
// between and nothing to poll for. That machinery is exactly the kind of thing to add when a
// second product actually needs it, not ahead of time.

import { For } from "solid-js";

const PRODUCTS = [
  { id: "skin", label: "Skin", url: "http://localhost:5174/" },
] as const;

export function Panel() {
  return (
    <div class="panel">
      <div class="panel-bar">
        <span class="panel-brand">Panel</span>
        <div class="panel-tabs" role="tablist" aria-label="Products">
          <For each={PRODUCTS}>
            {(product) => (
              <span class="panel-tab" role="tab" aria-selected="true">
                {product.label}
              </span>
            )}
          </For>
        </div>
      </div>

      <div class="panel-stage">
        <iframe src={PRODUCTS[0].url} title={PRODUCTS[0].label} />
      </div>
    </div>
  );
}
