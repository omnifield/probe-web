import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ok, registerTool } from "@web-core/mcp";
import { createServer, type ZoneServer } from "@web-core/mcp/transport";
import { httpPeer, stdioPeer, type Peer } from "../src/mcp/index.js";

const PORT = 39793;
const URL_ = `http://127.0.0.1:${PORT}/mcp`;
const STDIO_FIXTURE = fileURLToPath(new URL("./fixtures/stdio-ping-server.mjs", import.meta.url));

const registerPing = (server: McpServer) =>
  registerTool(server, { name: "ping", description: "pong", access: "read", handler: () => ok("pong") });

let server: ZoneServer | undefined;
let peer: Peer | undefined;

afterEach(async () => {
  await peer?.close();
  peer = undefined;
  await server?.close();
  server = undefined;
});

describe("httpPeer — та же форма поверх @tanstack/ai-mcp", () => {
  it("connects lazily and calls a real tool on a real listening server", async () => {
    server = createServer({ name: "peer-target", version: "0.0.0", transport: "http", registerTools: registerPing });
    await server.listen(PORT);

    peer = httpPeer(URL_);
    const result = await peer.callTool("ping");

    expect(result.isError).toBe(false);
    expect(result.content[0]).toMatchObject({ type: "text", text: JSON.stringify("pong") });
  });

  it("does not open a connection before the first callTool", async () => {
    // Порт никем не занят — если бы httpPeer подключался заранее, конструктор бы упал или завис.
    peer = httpPeer(`http://127.0.0.1:${PORT + 1}/mcp`);
    expect(peer).toBeDefined();
  });
});

describe("stdioPeer — та же форма поверх @tanstack/ai-mcp", () => {
  it("spawns the process lazily and calls a real tool over stdio", async () => {
    peer = stdioPeer("node", [STDIO_FIXTURE]);
    const result = await peer.callTool("ping");

    expect(result.isError).toBe(false);
    expect(result.content[0]).toMatchObject({ type: "text", text: "pong" });
  });

  it("reuses the same process across repeated calls, not one per call", async () => {
    peer = stdioPeer("node", [STDIO_FIXTURE]);

    const first = await peer.callTool("whoami");
    const second = await peer.callTool("whoami");
    const secondText = second.content[0] as { text?: string };

    expect(first.content[0]).toMatchObject({ type: "text", text: secondText.text });
  });

  it("does not leak the parent's full environment by default", async () => {
    process.env["STDIO_PEER_TEST_VAR"] = "leaked-if-visible";
    peer = stdioPeer("node", [STDIO_FIXTURE]);

    const result = await peer.callTool("env-probe");

    expect(result.content[0]).toMatchObject({ type: "text", text: "" });
    delete process.env["STDIO_PEER_TEST_VAR"];
  });

  it("passes through env explicitly when asked", async () => {
    process.env["STDIO_PEER_TEST_VAR"] = "reached-the-child";
    peer = stdioPeer("node", [STDIO_FIXTURE], { env: process.env });

    const result = await peer.callTool("env-probe");

    expect(result.content[0]).toMatchObject({ type: "text", text: "reached-the-child" });
    delete process.env["STDIO_PEER_TEST_VAR"];
  });

  it("closes cleanly via [Symbol.asyncDispose] (await using), not just close()", async () => {
    {
      await using disposablePeer = stdioPeer("node", [STDIO_FIXTURE]);
      const result = await disposablePeer.callTool("ping");
      expect(result.content[0]).toMatchObject({ type: "text", text: "pong" });
    }
    // Если бы asyncDispose не звал close(), процесс остался бы висеть — afterEach здесь ничего не
    // закрывает (peer локальный), так что тест сам себе доказательство: он просто не подвисает.
  });
});
