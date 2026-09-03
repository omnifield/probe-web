import { Renderer } from "#/entities/component/ui/renderer/renderer.jsx";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  return <Renderer component={props.component} assembly={props.assembly} />;
}
