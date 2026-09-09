import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { err, ok, registerTool } from "@web-core/mcp";
import { limitSchema, paginate } from "@web-core/mcp/pagination";
import { store } from "../engine";

const STATUS_FILTER = z.enum(["open", "resolved", "all"]);
const SIGN = z.enum(["issue", "praise"]);
const SIGN_FILTER = z.enum(["issue", "praise", "all"]);

// Заявка без поля status — та, что записана до появления разбора: она открыта, а не «непонятно».
function statusOf(state: unknown): string {
  const said = (state as { status?: unknown } | null)?.status;
  return said === "resolved" ? "resolved" : "open";
}

// Заявка без поля sign — та, что записана до появления знака: считаем issue (старое поведение —
// форма и так была только про расхождение), не "непонятно какое".
function signOf(state: unknown): string {
  const said = (state as { sign?: unknown } | null)?.sign;
  return said === "praise" ? "praise" : "issue";
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
    handler: async ({ tool, action, expected, actual, sign = "issue" }) => {
      const name = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const state = { tool, action, expected, actual, sign, at: new Date().toISOString(), status: "open" };
      const mark = sign === "praise" ? "👍 " : "";
      return ok({ saved: await store.save("feedback", name, state, `${mark}${tool}: ${actual.slice(0, 60)}`) });
    },
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
      const records = await store.list("feedback");
      const entries = await Promise.all(records.map((record) => store.read(record.id)));
      const byStatus = status === "all" ? entries : entries.filter((entry) => statusOf(entry.state) === status);
      const wanted = sign === "all" ? byStatus : byStatus.filter((entry) => signOf(entry.state) === sign);

      const summaries = wanted.map((entry) => {
        const state = entry.state as Record<string, unknown>;
        return {
          name: entry.name,
          label: entry.label,
          tool: state["tool"],
          sign: signOf(state),
          status: statusOf(state),
          at: state["at"],
        };
      });

      const page = paginate(summaries, { cursor, limit });
      return ok({ items: page.items, nextCursor: page.nextCursor });
    },
  });

  registerTool(server, {
    name: "get_feedback",
    title: "Содержимое репорта",
    description: "Полный tool/action/expected/actual одной заявки по имени (см. list_feedback).",
    access: "read",
    input: z.object({ name: z.string().describe("имя заявки из list_feedback (report-…)") }),
    handler: async ({ name }) => {
      const record = await store.findByName("feedback", name);
      if (!record) return err(`заявки "${name}" нет — имя берётся из list_feedback`);
      return ok(await store.read(record.id));
    },
  });

  registerTool(server, {
    name: "resolve_feedback",
    title: "Закрыть репорт",
    description: "Ставит status:\"resolved\" на заявке по имени (не удаляет) — уходит из list_feedback по умолчанию.",
    access: "write",
    input: z.object({
      name: z.string().describe("имя заявки из list_feedback (report-…)"),
      note: z.string().optional().describe("чем кончился разбор — своими словами"),
    }),
    handler: async ({ name, note }) => {
      const existing = await store.findByName("feedback", name);
      if (!existing) return err(`заявки "${name}" нет — имя берётся из list_feedback`);

      const entry = await store.read(existing.id);
      const state = entry.state as Record<string, unknown>;

      if (statusOf(state) === "resolved") return err(`заявка "${name}" уже разобрана`);

      const next = { ...state, status: "resolved", resolvedAt: new Date().toISOString(), ...(note ? { note } : {}) };
      return ok({ resolved: await store.update(existing.id, "feedback", name, next, entry.label) });
    },
  });
}
