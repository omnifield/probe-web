import { Button } from "@web-core/ui";
import type { SkinMode, SkinSwitch, SkinWorn } from "@web-core/runtime";
import { createResource, createSignal, For, onMount, Show } from "solid-js";

import { listOutfits } from "./skins.js";

const MODES = ["light", "dark"] as const;

export function App(props: { skin: SkinSwitch }) {
  const [worn, setWorn] = createSignal<SkinWorn | null>(null);
  const [refusal, setRefusal] = createSignal<string | null>(null);
  const [records] = createResource(() => listOutfits());

  const reasonOf = (cause: unknown): string => (cause instanceof Error ? cause.message : String(cause));

  const wearing = (attempt: Promise<SkinWorn | null>): void => {
    void attempt
      .then((next) => {
        setRefusal(null);
        setWorn(next);
      })
      .catch((cause: unknown) => {
        console.debug("skin not worn", cause);
        setRefusal(reasonOf(cause));
      });
  };

  // First load: same skin the showcase would already have picked, no memory of our own —
  // ewc has no choice a person made here, it is just showing what exists.
  onMount(() => {
    void (async () => {
      try {
        const [first] = await props.skin.names();
        if (first !== undefined) setWorn(await props.skin.wear(first, { remember: false }));
      } catch (cause) {
        console.debug("no skin on first load", cause);
        setRefusal(reasonOf(cause));
      }
    })();
  });

  const choose = (name: string) => {
    if (name === "") {
      props.skin.takeOff();
      setWorn(props.skin.worn());
    } else {
      wearing(props.skin.wear(name));
    }
  };

  const setMode = (mode: SkinMode) => {
    const current = worn();
    if (current === null) return;
    wearing(props.skin.wear(current.name, { mode }));
  };

  return (
    <div class="ewc-placeholder">
      <h1>ewc</h1>
      <p>skins come from the same presets service as apps/skin — nothing local here</p>

      <Show when={refusal()}>{(said) => <p class="ewc-trouble">{said()}</p>}</Show>

      <select
        class="ewc-select"
        aria-label="Skin"
        value={worn()?.name ?? ""}
        disabled={records.error !== undefined || (records()?.length ?? 0) === 0}
        onChange={(event) => choose(event.currentTarget.value)}
      >
        <option value="">no skin</option>
        <For each={records() ?? []}>{(record) => <option value={record.name}>{record.label}</option>}</For>
      </select>

      <Show when={worn() !== null}>
        <div class="ewc-modes" role="group" aria-label="Theme">
          <For each={MODES}>
            {(value) => (
              <button
                type="button"
                class="ewc-mode-btn"
                aria-pressed={worn()?.mode === value}
                onClick={() => setMode(value)}
              >
                {value}
              </button>
            )}
          </For>
        </div>
      </Show>

      <Button>Button from the kit</Button>
    </div>
  );
}
