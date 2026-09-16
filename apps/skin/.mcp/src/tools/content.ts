import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { limitSchema, paginate } from "@web-core/neurobox/pagination";
import { err, ok, registerTool } from "@web-core/neurobox/server";
import { checkContentData, presets } from "../engine";
import { authorGuard, resolveAuthor } from "./shared";

// list_content сознательно без state (тот же приём, что headersOf у list_presets, бюджет токенов):
// 13589 знаков на 20 записей, 10107 из них — тело (state) — замерено живьём внешним агентом.
// get_content уже существует для тела одной записи.
function headersOf(
  records: Awaited<ReturnType<typeof presets.list<"content">>>,
) {
  return records.map((r) => ({
    id: r.id,
    label: r.label,
    name: r.name,
    component: r.state.component,
    savedAt: r.savedAt,
  }));
}

export function registerContentTools(server: McpServer): void {
  registerTool(server, {
    name: "save_content",
    title: "Сохранить данные для наполнения компонента",
    description:
      'Реальные данные (не мок) под компонент, сверенные с io-схемой ДО записи. author — см. get_doc("author").',
    access: "write",
    input: z.object({
      component: z
        .string()
        .describe("имя компонента, оно же data-scope из паспорта"),
      name: z
        .string()
        .describe(
          "имя ЭТОГО набора данных, не компонента — можно завести несколько на компонент",
        ),
      data: z
        .unknown()
        .describe("данные вида, ожидаемого io-схемой компонента"),
      label: z.string().optional(),
      author: z
        .string()
        .optional()
        .describe(
          "резерв на stdio без заголовка; на HTTP имя берётся из X-User-Login",
        ),
    }),
    handler: async (
      { component, name, data, label, author: argumentAuthor },
      context,
    ) => {
      const author = resolveAuthor(context, argumentAuthor);
      const guardFlaw = await authorGuard("content", name, author);
      if (guardFlaw) return err(guardFlaw);

      const check = checkContentData(component, data);
      if (!check.ok) return ok(check);

      const state =
        author !== undefined
          ? { component, data, author }
          : { component, data };
      return ok({
        saved: await presets.replace("content", name, state, label),
      });
    },
  });

  registerTool(server, {
    name: "list_content",
    title: "Перечень сохранённых данных наполнения",
    description:
      "Заголовки записей (без data — см. get_content) постранично; component сужает до одного компонента.",
    access: "read",
    input: z.object({
      component: z.string().optional(),
      cursor: z.string().optional(),
      limit: limitSchema.optional(),
    }),
    handler: async ({ component, cursor, limit }) => {
      const entries = await presets.list("content");
      const matching = component
        ? entries.filter((entry) => entry.state.component === component)
        : entries;
      return ok(paginate(headersOf(matching), { cursor, limit }));
    },
  });

  registerTool(server, {
    name: "get_content",
    title: "Содержимое набора данных наполнения",
    description:
      "Один набор данных по имени (см. list_content) — конверт целиком, .state есть {component, data}.",
    access: "read",
    input: z.object({ name: z.string() }),
    handler: async ({ name }) => {
      const record = await presets.get("content", name);
      if (!record) return err(`no content record named "${name}"`);
      return ok(record);
    },
  });
}
