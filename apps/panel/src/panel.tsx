// Dev panel: the one place to walk through products (`PWEB-124`).
//
// EACH PRODUCT'S IFRAME POINTS STRAIGHT AT ITS OWN PORT, no proxy in between. A proxy through
// this app's own dev server was tried and measured slower live: the same content loaded fast on
// its own port and slow through the extra hop. There is also no "only one port reaches the
// browser" constraint to route around here — every product's port is already reachable directly.
//
// NO LIVENESS POLLING (yet): tab switching arrived with the second product (`ewc`); polling
// whether a product's dev server is actually up is a separate, still-unneeded step.

import { createSignal, For } from "solid-js";

const PRODUCTS = [
  { id: "skin", label: "Skin", url: "http://localhost:5174/" },
  { id: "ewc", label: "EWC", url: "http://localhost:5175/" },
  { id: "diagrams", label: "Diagrams", url: "http://localhost:5176/" },
  { id: "windshift", label: "Windshift", url: "http://localhost:5555/" },
] as const;

export function Panel() {
  const [selected, setSelected] = createSignal<(typeof PRODUCTS)[number]["id"]>(PRODUCTS[0].id);
  const current = () => PRODUCTS.find((product) => product.id === selected())!;

  return (
    <div class="panel">
      <div class="panel-bar">
        <span class="panel-brand">Panel</span>
        <div class="panel-tabs" role="tablist" aria-label="Products">
          <For each={PRODUCTS}>
            {(product) => (
              <span
                class="panel-tab"
                role="tab"
                aria-selected={selected() === product.id}
                onClick={() => setSelected(product.id)}
              >
                {product.label}
              </span>
            )}
          </For>
        </div>
      </div>

      <div class="panel-stage">
        <iframe src={current().url} title={current().label} />
      </div>
    </div>
  );
}
