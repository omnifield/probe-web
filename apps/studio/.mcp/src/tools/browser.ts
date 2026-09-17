import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { err, ok, registerTool } from "@web-core/neurobox/server";
import { browser } from "../engine";

export function registerBrowserTools(server: McpServer): void {
  // Своя вкладка на СЕССИЮ, не на весь сервер — registerTools зовётся заново на каждую новую
  // сессию (@web-core/neurobox/server), замыкание здесь и есть та самая изоляция.
  let pageId: number | undefined;

  async function ensurePage(): Promise<number> {
    if (pageId === undefined) pageId = await browser.newPage();
    return pageId;
  }

  registerTool(server, {
    name: "browser_navigate",
    title: "Открыть страницу в браузере сервера",
    description:
      "Жёсткий переход по URL в своей вкладке (одна на сессию). Не воспроизводит клик внутри SPA — см. browser_click.",
    access: "read",
    input: z.object({ url: z.string().describe("куда перейти") }),
    handler: async ({ url }) => {
      const id = await ensurePage();
      return ok({ report: await browser.navigate(id, url) });
    },
  });

  registerTool(server, {
    name: "browser_snapshot",
    title: "Снимок доступности текущей страницы",
    description:
      "Текстовое a11y-дерево с uid на узел — источник адресации для browser_click.",
    access: "read",
    handler: async () => {
      if (pageId === undefined)
        return err("no page yet — call browser_navigate first");
      return ok({ snapshot: await browser.snapshot(pageId) });
    },
  });

  registerTool(server, {
    name: "browser_click",
    title: "Клик по элементу своей страницы",
    description:
      "Настоящий клик мышью по uid из СВЕЖЕГО browser_snapshot — не переход по URL.",
    access: "read",
    input: z.object({
      uid: z.string().describe("узел из browser_snapshot"),
      dblClick: z.boolean().optional(),
    }),
    handler: async ({ uid, dblClick }) => {
      if (pageId === undefined)
        return err("no page yet — call browser_navigate first");
      return ok({ report: await browser.click(pageId, uid, { dblClick }) });
    },
  });

  registerTool(server, {
    name: "browser_screenshot",
    title: "Скриншот текущей страницы",
    description:
      "PNG текущей вкладки — единственный способ реально УВИДЕТЬ вид, не только CSS-текст.",
    access: "read",
    handler: async () => {
      if (pageId === undefined)
        return err("no page yet — call browser_navigate first");
      const { mimeType, base64 } = await browser.screenshot(pageId);
      return {
        content: [{ type: "image", data: base64, mimeType }],
        isError: false,
      };
    },
  });
}
