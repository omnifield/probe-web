import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createBrowser } from "../src/browser";

// Реальный headless Chromium — не мок. Требует бинарник на диске; в CI/окружениях без него тест
// честно пропускается (skipIf), а не подделывает ответ chrome-devtools-mcp вымышленным JSON.
const EXECUTABLE = process.env["WEB_CORE_MCP_TEST_CHROME"] ?? "/home/node/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome";
const hasChrome = existsSync(EXECUTABLE);

describe.skipIf(!hasChrome)("createBrowser — реальный headless Chromium через chrome-devtools-mcp", () => {
  it(
    "opens a page, navigates it, and returns a real screenshot",
    async () => {
      const browser = createBrowser({ executablePath: EXECUTABLE });

      const pageId = await browser.newPage();
      expect(typeof pageId).toBe("number");

      const report = await browser.navigate(pageId, "data:text/html,<h1>web-core</h1>");
      expect(report).toContain("Successfully navigated");

      const shot = await browser.screenshot(pageId);
      expect(shot.mimeType).toBe("image/png");
      expect(shot.base64.length).toBeGreaterThan(100);
    },
    30_000,
  );

  it(
    "clicks a real element found via snapshot, not a URL jump",
    async () => {
      const browser = createBrowser({ executablePath: EXECUTABLE });
      const pageId = await browser.newPage();

      const html =
        '<button id="a">click me</button><p id="out">before</p>' +
        '<script>document.getElementById("a").onclick=()=>document.getElementById("out").textContent="after"</script>';
      await browser.navigate(pageId, `data:text/html,${encodeURIComponent(html)}`);

      const before = await browser.snapshot(pageId);
      expect(before).toContain('button "click me"');
      expect(before).toContain('StaticText "before"');

      const uid = before.match(/uid=(\S+) button "click me"/)?.[1];
      expect(uid).toBeDefined();

      await browser.click(pageId, uid!);

      const after = await browser.snapshot(pageId);
      expect(after).toContain('StaticText "after"');
    },
    30_000,
  );
});
