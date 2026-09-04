// ТЕМА — подключение скина продукта, выбор наряда по имени (`Select`) и переключатель половины
// (`Toggle`, светлая/тёмная) — в одном компоненте: одно не имеет смысла без другого, скин
// подключаем ровно затем, чтобы было чем управлять (`createSkinConnection`,
// `@web-core/runtime`, PWEB-213).
//
// ИСТОЧНИК — НАСТОЯЩАЯ СЛУЖБА РАЗДАЧИ (`createPresetsSkinSource`, `@web-core/skin/
// presets`, PWEB-215): продукт отдаёт адрес и паспорта СВОЕГО кита, HTTP/разбор/сборку/
// порождение CSS фабрика берёт на себя целиком. `SOURCE.names()` уже читается через
// `createResource` — список не литерал, `Select` не придётся переделывать, когда нарядов в
// службе станет больше одного.
import {
  createPresetsSkinSource,
  PresetsDown,
  PresetsRefused,
} from "@web-core/skin/presets";
import { createSkinConnection } from "@web-core/runtime";
import { passportOf } from "@web-core/ui/passport";
import {
  Select,
  SelectClearTrigger,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
  Toggle,
  ToggleIndicator,
} from "@web-core/ui";
import { createMemo, createResource, For, onMount, Show } from "solid-js";

/** Адрес службы раздачи — задаётся снаружи, умолчание — служба на этой машине. */
const PRESETS_URL =
  (import.meta.env["VITE_PRESETS_URL"] as string | undefined) ?? "http://127.0.0.1:8787/api/presets";

/** Наряд, который надеваем на первом заходе, если запомненного нет — единственный сегодня в службе. */
const DEFAULT_SKIN = "omnifield";

const SOURCE = createPresetsSkinSource({ url: PRESETS_URL, lookup: passportOf });

/** Причина отказа — короткой строкой человеку, не в отладчик. */
function reasonOf(cause: unknown): string {
  if (cause instanceof PresetsDown) return `${cause.message} · служба раздачи не отвечает`;
  if (cause instanceof PresetsRefused) return cause.message;
  return cause instanceof Error ? cause.message : String(cause);
}

interface SkinItem {
  readonly value: string;
  readonly label: string;
}

export function ThemeSwitch() {
  const skin = createSkinConnection(SOURCE, { fallback: { skin: DEFAULT_SKIN, mode: "light" } });

  const [names] = createResource(() => SOURCE.names());
  const items = createMemo((): SkinItem[] => (names() ?? []).map((name) => ({ value: name, label: name })));

  onMount(() => {
    skin.restore().catch((cause: unknown) => console.debug("скин не надет", cause));
  });

  const dark = createMemo(() => skin.worn()?.mode === "dark");

  const trouble = (): string | null => {
    if (names.error !== undefined) return reasonOf(names.error);
    return names() !== undefined && names()!.length === 0 ? "Нарядов в службе нет" : null;
  };

  return (
    <div style={{ display: "flex", "align-items": "center", gap: "var(--space-3)" }}>
      <Show when={trouble()}>{(said) => <span>{said()}</span>}</Show>

      <Select
        items={items()}
        value={skin.worn() ? [skin.worn()!.name] : []}
        onValueChange={(details) => {
          const name = details.value[0];
          if (name !== undefined) {
            void skin.wear(name).catch((cause: unknown) => console.debug("скин не надет", cause));
          }
        }}
      >
        <SelectLabel>Скин</SelectLabel>
        <SelectControl>
          <SelectTrigger>
            <SelectValueText placeholder="Выбрать скин" />
          </SelectTrigger>
          <SelectClearTrigger>✕</SelectClearTrigger>
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
