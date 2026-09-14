// ТЕМА — выбор наряда по имени (`Select`) и переключатель половины (`Toggle`, светлая/тёмная).
// Сам механизм одевания (соединение, восстановление запомненного выбора при старте, список имён
// источника) заводит `SkinProvider` на уровне приложения (`app/index.tsx`, `#/shared/api/skin`) —
// этот компонент только читает готовый контекст (`useSkin()`) и рисует UI поверх него, источником
// сам не владеет.
import { PresetsDown, PresetsRefused } from "@web-core/skin/presets";
import { useSkin } from "@web-core/skin/solid";
import { componentStore } from "#/entities/component";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
  Toggle,
  ToggleIndicator,
} from "@web-core/ui";
import { createEffect, createMemo, For, Show } from "solid-js";

/** Причина отказа — короткой строкой человеку, не в отладчик. */
function reasonOf(cause: unknown): string {
  if (cause instanceof PresetsDown)
    return `${cause.message} · служба раздачи не отвечает`;
  if (cause instanceof PresetsRefused) return cause.message;
  return cause instanceof Error ? cause.message : String(cause);
}

interface SkinItem {
  readonly value: string;
  readonly label: string;
}

export function ThemeSwitch() {
  const skin = useSkin();

  const items = createMemo((): SkinItem[] =>
    (skin.names() ?? []).map((name) => ({ value: name, label: name })),
  );

  const dark = createMemo(() => skin.worn()?.mode === "dark");
  const outfitName = createMemo(() => skin.worn()?.name);

  createEffect(() => {
    componentStore.actions.setOutfit(outfitName());
  });

  const trouble = (): string | null => {
    if (skin.names.error !== undefined) return reasonOf(skin.names.error);
    return skin.names() !== undefined && skin.names()!.length === 0
      ? "Нарядов в службе нет"
      : null;
  };

  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "var(--space-3)",
      }}
    >
      <Show when={trouble()}>{(said) => <span>{said()}</span>}</Show>

      <Select
        items={items()}
        value={skin.worn() ? [skin.worn()!.name] : []}
        onValueChange={(details) => {
          const name = details.value[0];
          if (name !== undefined) {
            void skin
              .wear(name)
              .catch((cause: unknown) => console.debug("скин не надет", cause));
          }
        }}
      >
        <SelectControl>
          <SelectTrigger>
            <SelectValueText placeholder="Выбрать скин" />
          </SelectTrigger>

          <SelectIndicator>▾</SelectIndicator>
        </SelectControl>
        <SelectPositioner>
          <SelectContent>
            <For each={items()}>
              {(item) => (
                <SelectItem item={item}>
                  <SelectItemText>{item.label}</SelectItemText>
                  <SelectItemIndicator>✓</SelectItemIndicator>
                </SelectItem>
              )}
            </For>
          </SelectContent>
        </SelectPositioner>
        <SelectHiddenSelect />
      </Select>

      <Toggle
        pressed={dark()}
        onPressedChange={(pressed) => skin.setMode(pressed ? "dark" : "light")}
        aria-label="Тёмная тема"
      >
        <ToggleIndicator>{dark() ? "🌙" : "☀️"}</ToggleIndicator>
      </Toggle>
    </div>
  );
}
