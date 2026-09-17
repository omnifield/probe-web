import { Icon, Toggle, ToggleIndicator, type IconProps } from "@web-core/ui";
import {
  AXIS_MODES,
  componentManagerStoreOf,
  useComponentName,
} from "../../../../model";

type IconName = IconProps["name"];

function iconOf<Value extends string>(
  items: readonly { value: Value; icon: IconName }[],
  value: Value,
): IconName {
  return items.find((item) => item.value === value)!.icon;
}

export function SwitchAxisMode() {
  const store = componentManagerStoreOf(useComponentName());
  const axisMode = store.use((state) => state.axisMode);

  return (
    <Toggle
      pressed={axisMode() === "assembly"}
      onPressedChange={(pressed) =>
        store.actions.setAxisMode(pressed ? "assembly" : "variant")
      }
    >
      <ToggleIndicator fallback={<Icon name={iconOf(AXIS_MODES, "variant")} />}>
        <Icon name={iconOf(AXIS_MODES, "assembly")} />
      </ToggleIndicator>
    </Toggle>
  );
}
