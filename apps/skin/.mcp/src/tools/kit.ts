import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { err, ok, registerTool } from "@web-core/neurobox/server";
import { limitSchema, paginate } from "@web-core/neurobox/pagination";
import { GROUPS, type ComponentGroup } from "@web-core/skin/editor";
import { getAssemblies, getAssembly, getDoc, getIoSchema, getPassport, listComponents, listDocs } from "../engine";

// Список групп берётся у кита, не переписывается здесь: разойдись они — фильтр молча пустеет.
const GROUP = z.enum(Object.keys(GROUPS) as [ComponentGroup, ...ComponentGroup[]]);
const FOOTPRINT = z.enum(["compact", "regular", "wide"]);

export function registerKitTools(server: McpServer): void {
  registerTool(server, {
    name: "list_docs",
    title: "Перечень тематических доков",
    description: "Заголовки docs/*.md этой зоны, без содержимого — открыть нужную темой get_doc.",
    access: "read",
    input: z.object({
      cursor: z.string().optional().describe("курсор из предыдущей страницы"),
      limit: limitSchema.optional(),
    }),
    handler: async ({ cursor, limit }) => ok(paginate(await listDocs(), { cursor, limit })),
  });

  registerTool(server, {
    name: "get_doc",
    title: "Содержимое тематического дока",
    description: "Сырой markdown одного docs/<topic>.md — имя topic берите из list_docs.",
    access: "read",
    input: z.object({ topic: z.string() }),
    handler: async ({ topic }) => {
      const content = await getDoc(topic);
      return content === undefined ? err(`no doc named "${topic}" — see list_docs`) : ok(content);
    },
  });

  registerTool(server, {
    name: "list_components",
    title: "Компоненты кита",
    description: "Карточка на компонент (род/группа/размерность/пакет/число частей/имена сборок); фильтр group/footprint, страница.",
    access: "read",
    input: z.object({
      group: GROUP.optional().describe("группа компонента; не названа — все группы"),
      footprint: FOOTPRINT.optional().describe("размерность компонента; не названа — все"),
      cursor: z.string().optional().describe("курсор из предыдущей страницы"),
      limit: limitSchema.optional(),
    }),
    handler: ({ group, footprint, cursor, limit }) =>
      ok(paginate(listComponents({ group, footprint }), { cursor, limit })),
  });

  registerTool(server, {
    name: "get_passport",
    title: "Паспорт компонента",
    description: "Части, состояния, настройки, variantAxis, selfAssembly — только паспорт, без сборок/io.",
    access: "read",
    input: z.object({ component: z.string().describe("имя компонента, оно же data-scope") }),
    handler: ({ component }) => {
      const info = getPassport(component);
      return info ? ok(info) : err(`unknown component "${component}" — no passport in the kit`);
    },
  });

  registerTool(server, {
    name: "get_assemblies",
    title: "Сборки компонента",
    description: "Без name — список {name, means}. С name — полное дерево ОДНОЙ сборки (дороже, по запросу).",
    access: "read",
    input: z.object({
      component: z.string(),
      name: z.string().optional().describe("имя сборки из списка без него; не названо — вернётся список"),
    }),
    handler: ({ component, name }) => {
      if (name === undefined) {
        const cards = getAssemblies(component);
        return cards ? ok(cards) : err(`unknown component "${component}" — no passport in the kit`);
      }

      const result = getAssembly(component, name);
      if (result.ok) return ok(result.assembly);
      if (result.reason === "unknown-component") return err(`unknown component "${component}" — no passport in the kit`);
      return err(`unknown assembly "${name}" on component "${component}" — see get_assemblies without name`);
    },
  });

  registerTool(server, {
    name: "get_io_schema",
    title: "io-схема компонента",
    description: "JSON Schema {input, output} компонента — своя сущность, не часть паспорта.",
    access: "read",
    input: z.object({ component: z.string() }),
    handler: ({ component }) => {
      const schema = getIoSchema(component);
      return schema ? ok(schema) : err(`unknown component "${component}" — no passport in the kit`);
    },
  });
}
