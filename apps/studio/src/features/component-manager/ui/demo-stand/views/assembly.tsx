import type { PassportAssembly } from "@web-core/skin/editor";

export function Assembly(props: { assembly: PassportAssembly }) {
  return <div>{JSON.stringify(props.assembly, null, 2)}</div>;
}
