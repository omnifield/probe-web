import { ComponentPreview } from "#/widgets/component-preview/component-preview.jsx";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  return <ComponentPreview component={props.component} assembly={props.assembly} />;
}
