import { StandControlAssembly } from "./assembly";
import { StandControlVariant } from "./variant";
import { StandControlView, type StandMode } from "./view";

export type { StandMode } from "./view";

export function StandControl(props: {
  mode: StandMode;
  onModeChange: (mode: StandMode) => void;
  label: string;
}) {
  return (
    <>
      <StandControlView mode={props.mode} onModeChange={props.onModeChange} />
      <StandControlAssembly />
      <StandControlVariant label={props.label} />
    </>
  );
}
