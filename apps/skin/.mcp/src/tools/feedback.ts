import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { err, ok, registerTool } from "@web-core/mcp";
import { FeedbackRefused, listFeedback, reportFeedback, resolveFeedback, type FeedbackEntry } from "@web-core/mcp/feedback";
import { limitSchema, paginate } from "@web-core/mcp/pagination";
import { presetsServiceUrl } from "../engine";

const STATUS_FILTER = z.enum(["open", "resolved", "all"]);
const SIGN = z.enum(["issue", "praise"]);
const SIGN_FILTER = z.enum(["issue", "praise", "all"]);

// FeedbackEntry не несёт человеческого ярлыка (не Preset, envelope-label неоткуда взять) —
// считаем его на чтении, тем же приёмом, что раньше делал report_feedback перед записью.
function labelOf(entry: FeedbackEntry): string {
  const mark = entry.sign === "praise" ? "👍 " : "";
  return `${mark}${entry.tool}: ${entry.actual.slice(0, 60)}`;
}

export function registerFeedbackTools(server: McpServer): void {
  registerTool(server, {
    name: "report_feedback",
    title: "Оставить репорт по ручке",
    description: "Сигнал по любой ручке — tool/action/actual(+expected?), sign:issue(по умолчанию)|praise.",
    access: "write",
    input: z.object({
      tool: z.string().describe("имя ручки этого MCP, к которой относится репорт"),
      action: z.string().describe("что сделали — вызов и с чем, своими словами"),
      expected: z.string().optional().describe("что ожидали получить (для issue; необязательно для praise)"),
      actual: z.string().describe("что получили на самом деле — плохое или хорошее, по sign"),
      sign: SIGN.optional().describe("issue (по умолчанию) — что-то не так; praise — сработало хорошо"),
    }),
    handler: async ({ tool, action, expected, actual, sign }) =>
      ok({ saved: await reportFeedback(presetsServiceUrl, { tool, action, expected, actual, sign }) }),
  });

  registerTool(server, {
    name: "list_feedback",
    title: "Перечень репортов",
    description: "Заголовки заявок (без tool/action/expected/actual — см. get_feedback). По умолчанию status:open, sign:all.",
    access: "read",
    input: z.object({
      status: STATUS_FILTER.optional().describe("что показывать; по умолчанию только open"),
      sign: SIGN_FILTER.optional().describe("issue|praise|all; по умолчанию all"),
      cursor: z.string().optional().describe("курсор из предыдущей страницы"),
      limit: limitSchema.optional(),
    }),
    handler: async ({ status = "open", sign = "all", cursor, limit }) => {
      const entries = await listFeedback(presetsServiceUrl, {
        status: status === "all" ? undefined : status,
        sign: sign === "all" ? undefined : sign,
      });

      const summaries = entries.map((entry) => ({
        id: entry.id,
        label: labelOf(entry),
        tool: entry.tool,
        sign: entry.sign,
        status: entry.status,
        at: entry.at,
      }));

      const page = paginate(summaries, { cursor, limit });
      return ok({ items: page.items, nextCursor: page.nextCursor });
    },
  });

  registerTool(server, {
    name: "get_feedback",
    title: "Содержимое репорта",
    description: "Полный tool/action/expected/actual одной заявки по id (см. list_feedback).",
    access: "read",
    input: z.object({ id: z.string().describe("id заявки из list_feedback") }),
    handler: async ({ id }) => {
      const entries = await listFeedback(presetsServiceUrl);
      const entry = entries.find((candidate) => candidate.id === id);
      if (!entry) return err(`заявки "${id}" нет — id берётся из list_feedback`);
      return ok(entry);
    },
  });

  registerTool(server, {
    name: "resolve_feedback",
    title: "Закрыть репорт",
    description: "Ставит status:\"resolved\" на заявке по id (не удаляет) — уходит из list_feedback по умолчанию.",
    access: "write",
    input: z.object({
      id: z.string().describe("id заявки из list_feedback"),
      note: z.string().optional().describe("чем кончился разбор — своими словами"),
    }),
    handler: async ({ id, note }) => {
      try {
        return ok({ resolved: await resolveFeedback(presetsServiceUrl, id, note) });
      } catch (cause) {
        if (cause instanceof FeedbackRefused) return err(cause.message);
        throw cause;
      }
    },
  });
}
