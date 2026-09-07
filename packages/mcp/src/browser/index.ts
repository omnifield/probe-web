
import { stdioPeer } from "../peer/index.js";

export interface BrowserOptions {
  readonly executablePath?: string;
  readonly headless?: boolean;
  readonly isolated?: boolean;
  readonly chromeArgs?: readonly string[];
  readonly version?: string;
}

export interface Screenshot {
  readonly mimeType: string;
  readonly base64: string;
}

export interface Browser {
  readonly newPage: () => Promise<number>;
  readonly navigate: (pageId: number, url: string) => Promise<string>;
  readonly screenshot: (pageId: number) => Promise<Screenshot>;
}

interface ToolContent {
  readonly type: string;
  readonly text?: string;
  readonly data?: string;
  readonly mimeType?: string;
}

function textOf(content: readonly ToolContent[]): string {
  return content.find((part) => part.type === "text")?.text ?? "";
}

// Обёртка над `chrome-devtools-mcp` (отдельный пакет, свой процесс) — не своя реализация рендера.
// `--isolated` по умолчанию: свой профиль, не мешает ничьему интерактивному браузеру на той же
// машине (тот же класс проблемы, что конфликт двух сеансов на одном userDataDir). Один вызов
// `createBrowser` — один процесс, лениво (на первый реальный вызов — так уже несёт `stdioPeer`).
export function createBrowser(options: BrowserOptions = {}): Browser {
  const {
    executablePath,
    headless = true,
    isolated = true,
    chromeArgs = ["--no-sandbox", "--disable-dev-shm-usage"],
    version = "1.8.0",
  } = options;

  const args = [`chrome-devtools-mcp@${version}`];
  if (headless) args.push("--headless");
  if (isolated) args.push("--isolated");
  for (const arg of chromeArgs) args.push(`--chromeArg=${arg}`);
  if (executablePath) args.push("--executablePath", executablePath);

  const peer = stdioPeer("npx", args, { name: "web-core-mcp-browser" });

  return {
    // pageId — числовой индекс страницы у chrome-devtools-mcp (см. его --pageIdRouting, по
    // умолчанию включён — специально под конкурентные сессии), не uuid; своего ответа с готовым id
    // тулы не отдают, только текстовый список страниц с пометкой "[selected]" на только что
    // созданной — разбираем регуляркой ровно так же, как это делает сам CLI-клиент.
    async newPage(): Promise<number> {
      const result = await peer.callTool("new_page", { url: "about:blank" });
      const content = result.content as readonly ToolContent[];

      if (result.isError) throw new Error(`browser: new_page failed — ${textOf(content)}`);

      const match = textOf(content).match(/^(\d+):.*\[selected\]/m);
      if (!match) throw new Error(`browser: could not find a page id in new_page's reply: ${textOf(content)}`);

      return Number(match[1]);
    },

    async navigate(pageId: number, url: string): Promise<string> {
      const result = await peer.callTool("navigate_page", { pageId, type: "url", url });
      const content = result.content as readonly ToolContent[];

      if (result.isError) throw new Error(`browser: navigate_page failed — ${textOf(content)}`);
      return textOf(content);
    },

    async screenshot(pageId: number): Promise<Screenshot> {
      const result = await peer.callTool("take_screenshot", { pageId, format: "png" });
      const content = result.content as readonly ToolContent[];

      if (result.isError) throw new Error(`browser: take_screenshot failed — ${textOf(content)}`);

      const image = content.find((part) => part.type === "image");
      if (!image?.data) throw new Error("browser: take_screenshot did not return an image part");

      return { mimeType: image.mimeType ?? "image/png", base64: image.data };
    },
  };
}
