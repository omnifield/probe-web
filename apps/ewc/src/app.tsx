import { Button } from "@omnifield/probe-web-ui";
import type { SkinMode, SkinSwitch } from "@omnifield/probe-web-runtime";
import { createSignal, For } from "solid-js";

import { EWC_SKIN } from "./skin.js";

const MODES = ["light", "dark"] as const;

export function App(props: { skin: SkinSwitch }) {
  const [mode, setMode] = createSignal<SkinMode>("light");

  const choose = (next: SkinMode) => {
    setMode(next);
    void props.skin.wear(EWC_SKIN.name, { mode: next });
  };

  return (
    <div class="ewc-placeholder">
      <h1>ewc</h1>
      <p>placeholder — nothing built yet</p>

      <div class="ewc-modes" role="group" aria-label="Theme">
        <For each={MODES}>
          {(value) => (
            <button
              type="button"
              class="ewc-mode-btn"
              aria-pressed={mode() === value}
              onClick={() => choose(value)}
            >
              {value}
            </button>
          )}
        </For>
      </div>

      <Button>Button from the kit</Button>
    </div>
  );
}
