import { StandControlAssembly } from "./assembly";
import { StandControlVariant } from "./variant";
import { StandControlView } from "./view";

export function StandControl(props: { label: string }) {
  return (
    <>
      <StandControlView />
      <StandControlAssembly />
      <StandControlVariant label={props.label} />
    </>
  );
}
