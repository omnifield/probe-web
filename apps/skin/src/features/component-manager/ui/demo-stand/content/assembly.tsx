import type { ComponentDescriptor } from "#/entities/component";

export function StandAssembly(props: { descriptor: ComponentDescriptor }) {
  const assemblies = () => props.descriptor.editorInfo?.assemblies ?? [];

  return <div>{JSON.stringify(assemblies(), null, 2)}</div>;
}
