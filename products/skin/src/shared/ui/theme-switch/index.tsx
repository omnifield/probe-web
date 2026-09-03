// ТЕМА — подключение скина продукта, выбор наряда по имени (`Select`) и переключатель половины
// (`Toggle`, светлая/тёмная) — в одном компоненте: одно не имеет смысла без другого, скин
// подключаем ровно затем, чтобы было чем управлять (`createSkinConnection`,
// `@omnifield/probe-web-runtime`, PWEB-213).
//
// ИСТОЧНИК ПОКА ЛОКАЛЬНЫЙ (`SOURCE`, один `SKIN` с `recipes: {}`) — служба пресетов уже держит
// настоящий наряд (`omnifield`), но подключение к ней — отдельный шаг, следующий за этим (сперва
// сам переключатель на компонентах кита, запрос — потом). `SOURCE.names()` уже читается через
// `createResource`, не литералом, — `Select` не придётся переделывать, когда имён станет больше
// одного.
import { withPassports, type Skin } from "@omnifield/probe-web-skin";
import {
  createSkinConnection,
  type SkinSource,
} from "@omnifield/probe-web-runtime";
import { passportOf } from "@omnifield/probe-web-ui/passport";
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
} from "@omnifield/probe-web-ui";
import { createMemo, createResource, For, onMount } from "solid-js";

const { generateSkinCss } = withPassports(passportOf);

/** Единственный локальный скин продукта. Наполняется по одному компоненту вслед за китом. */
const SKIN: Skin = {
  name: "skin",
  recipes: {},
};

const SOURCE: SkinSource = {
  names: () => [SKIN.name],
  css: (name) => {
    if (name !== SKIN.name) throw new Error(`[skin] скина «${name}» здесь нет — надевать нечего`);
    return generateSkinCss(SKIN);
  },
};

interface SkinItem {
  readonly value: string;
  readonly label: string;
}

export function ThemeSwitch() {
  const skin = createSkinConnection(SOURCE, { fallback: { skin: SKIN.name, mode: "light" } });

  onMount(() => void skin.restore());

  const [names] = createResource(() => SOURCE.names());
  const items = createMemo((): SkinItem[] => (names() ?? []).map((name) => ({ value: name, label: name })));

  const dark = createMemo(() => skin.worn()?.mode === "dark");

  return (
    <div style={{ display: "flex", "align-items": "center", gap: "var(--space-3)" }}>
      <Select
        items={items()}
        value={skin.worn() ? [skin.worn()!.name] : []}
        onValueChange={(details) => {
          const name = details.value[0];
          if (name !== undefined) void skin.wear(name);
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
