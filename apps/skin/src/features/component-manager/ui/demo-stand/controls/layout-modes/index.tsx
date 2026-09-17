import { Icon, Toggle, ToggleIndicator, type IconProps } from "@web-core/ui";
import {
  componentManagerStoreOf,
  LAYOUT_MODES,
  useComponentName,
} from "../../../../model";

type IconName = IconProps["name"];

function iconOf<Value extends string>(
  items: readonly { value: Value; icon: IconName }[],
  value: Value,
): IconName {
  return items.find((item) => item.value === value)!.icon;
}

export function SwitchLayoutMode() {
  const store = componentManagerStoreOf(useComponentName());
  const layoutMode = store.use((state) => state.layoutMode);

  return (
    <Toggle
      pressed={layoutMode() === "matrix"}
      onPressedChange={(pressed) =>
        store.actions.setLayoutMode(pressed ? "matrix" : "grid")
      }
    >
      <ToggleIndicator fallback={<Icon name={iconOf(LAYOUT_MODES, "grid")} />}>
        <Icon name={iconOf(LAYOUT_MODES, "matrix")} />
      </ToggleIndicator>
    </Toggle>
  );
}
