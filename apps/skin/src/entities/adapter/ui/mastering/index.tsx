import { Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { useAtom } from "@web-core/store";
import { componentHandle, currentComponent, schemaOutline } from "#/entities/component";
import { currentEndpointId, endpointsAtom } from "#/entities/openapi";
import { fieldsOfSkeleton, schemasAtom } from "#/entities/schema";
import { createEffect, createMemo } from "solid-js";

import { getOrCreateAdapter } from "../../model";
import { MappingBlock } from "./block";

export function AdapterMastering() {
  const info = componentHandle().info;

  const componentFields = createMemo(() => {
    const schema = info()?.io?.schema;
    return schema ? schemaOutline(schema) : [];
  });

  const endpoints = useAtom(endpointsAtom);
  const endpoint = createMemo(() => endpoints().find((one) => one.id === currentEndpointId()));

  const schemas = useAtom(schemasAtom);
  const schema = createMemo(() => {
    const current = endpoint();
    return current === undefined ? undefined : schemas().find((one) => one.endpointId === current.id);
  });

  const apiFields = createMemo(() => {
    const current = schema();
    return current === undefined ? [] : fieldsOfSkeleton(current.skeleton);
  });

  const title = createMemo(() => {
    const component = currentComponent() ?? "компонент не выбран";
    const current = endpoint();
    const endpointLabel = current === undefined ? "ручка не выбрана" : `${current.method} ${current.url === "" ? "(без адреса)" : current.url}`;
    return `${component} ↔ ${endpointLabel}`;
  });

  createEffect(() => {
    const component = currentComponent();
    const current = schema();
    if (component !== undefined && current !== undefined) getOrCreateAdapter(current.id, component);
  });

  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Typography>{title()}</Typography>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <MappingBlock title="Приём (ручка → компонент)" componentFields={componentFields()} apiFields={apiFields()} />
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <MappingBlock title="Отдача (компонент → ручка)" componentFields={componentFields()} apiFields={apiFields()} />
      </FlowItem>
    </Flow>
  );
}
