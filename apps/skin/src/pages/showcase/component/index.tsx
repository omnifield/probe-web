import type { ComponentDescriptor } from "#/entities/component";
import { DemoStand } from "#/features/component-manager";

export function ComponentPage(props: {
  component: string;
  descriptor: ComponentDescriptor;
}) {
  return <DemoStand component={props.component} descriptor={props.descriptor} />;
}
