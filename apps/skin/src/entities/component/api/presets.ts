import { presetsClient } from "#/shared/api/clients";

export function variantsOf(componentName: string) {
  return presetsClient.list("form", { component: [componentName] });
}

export function assembliesOf(componentName: string) {
  return presetsClient.list("assembly", { component: [componentName] });
}
