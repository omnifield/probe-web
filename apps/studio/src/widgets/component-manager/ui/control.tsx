import {
  FeedManual,
  FeedPreset,
  SwitchAxisMode,
  SwitchFilterMode,
  SwitchLayoutMode,
  SwitchViewMode,
} from "#/features/component-manager";

export function Control() {
  return (
    <>
      <SwitchViewMode />
      <SwitchAxisMode />
      <SwitchFilterMode />
      <SwitchLayoutMode />
      <FeedManual />
      <FeedPreset />
    </>
  );
}
