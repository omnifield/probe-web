import { afterEach, describe, expect, it } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { z } from "@web-core/io";
import { ok, registerTool } from "../src";
import { createServer, type ZoneServer } from "../src/transport";

const PORT = 39781;
const URL_ = new URL(`http://127.0.0.1:${PORT}/mcp`);

const registerPing = (server: McpServer) =>
  registerTool(server, { name: "ping", description: "pong", access: "read", handler: () => ok("pong") });

let server: ZoneServer | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

describe("createServer — transport: http", () => {
  it("serves a real tool call over Streamable HTTP when auth is absent", async () => {
    server = createServer({ name: "test-http", version: "0.0.0", transport: "http", registerTools: registerPing });
    await server.listen(PORT);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(new StreamableHTTPClientTransport(URL_));
    const result = await client.callTool({ name: "ping", arguments: {} });

    expect(result.isError).toBe(false);
    await client.close();
  });

  it("rejects listen() with a clear error instead of crashing when the port is already taken", async () => {
    server = createServer({ name: "test-http", version: "0.0.0", transport: "http", registerTools: registerPing });
    await server.listen(PORT);

    const second = createServer({ name: "test-http-2", version: "0.0.0", transport: "http", registerTools: registerPing });
    await expect(second.listen(PORT)).rejects.toThrow(/already in use|занят/i);
  });

  it("rejects with 401 before the request reaches the tool when auth fails", async () => {
    server = createServer({
      name: "test-http-auth",
      version: "0.0.0",
      transport: "http",
      auth: (req) => req.headers.authorization === "Bearer good",
      registerTools: registerPing,
    });
    await server.listen(PORT);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await expect(
      client.connect(new StreamableHTTPClientTransport(URL_, { requestInit: { headers: {} } })),
    ).rejects.toThrow();
  });

  it("lets the request through once auth passes", async () => {
    server = createServer({
      name: "test-http-auth-ok",
      version: "0.0.0",
      transport: "http",
      auth: (req) => req.headers.authorization === "Bearer good",
      registerTools: registerPing,
    });
    await server.listen(PORT);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(URL_, { requestInit: { headers: { authorization: "Bearer good" } } }),
    );
    const result = await client.callTool({ name: "ping", arguments: {} });

    expect(result.isError).toBe(false);
    await client.close();
  });

  it("serves two concurrent clients on their own sessions, neither evicting the other", async () => {
    server = createServer({ name: "test-http-multi", version: "0.0.0", transport: "http", registerTools: registerPing });
    await server.listen(PORT);

    const clientA = new Client({ name: "client-a", version: "0.0.0" });
    const transportA = new StreamableHTTPClientTransport(URL_);
    await clientA.connect(transportA);

    const clientB = new Client({ name: "client-b", version: "0.0.0" });
    const transportB = new StreamableHTTPClientTransport(URL_);
    await clientB.connect(transportB);

    expect(transportA.sessionId).toBeDefined();
    expect(transportB.sessionId).toBeDefined();
    expect(transportA.sessionId).not.toBe(transportB.sessionId);

    const [resultA, resultB] = await Promise.all([
      clientA.callTool({ name: "ping", arguments: {} }),
      clientB.callTool({ name: "ping", arguments: {} }),
    ]);

    expect(resultA.isError).toBe(false);
    expect(resultB.isError).toBe(false);

    const resultAAgain = await clientA.callTool({ name: "ping", arguments: {} });
    expect(resultAAgain.isError).toBe(false);

    await clientA.close();
    await clientB.close();
  });

  it("rejects a request whose Host header is not in allowedHosts", async () => {
    server = createServer({
      name: "test-http-host",
      version: "0.0.0",
      transport: "http",
      allowedHosts: ["allowed.example:1"],
      registerTools: registerPing,
    });
    await server.listen(PORT);

    const res = await fetch(URL_, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });

    expect(res.status).toBe(400);
  });

  it("rejects a request whose Origin header is not in allowedOrigins", async () => {
    server = createServer({
      name: "test-http-origin",
      version: "0.0.0",
      transport: "http",
      allowedOrigins: ["https://allowed.example"],
      registerTools: registerPing,
    });
    await server.listen(PORT);

    const res = await fetch(URL_, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        origin: "https://evil.example",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });

    expect(res.status).toBe(400);
  });

  it("rejects an unknown mcp-session-id with 404 without building a fresh server", async () => {
    let builds = 0;
    server = createServer({
      name: "test-http-unknown-session",
      version: "0.0.0",
      transport: "http",
      registerTools: (mcp) => {
        builds += 1;
        registerPing(mcp);
      },
    });
    await server.listen(PORT);

    const res = await fetch(URL_, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-session-id": "no-such-session",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });

    expect(res.status).toBe(404);
    expect(builds).toBe(0);
  });

  it("returns instructions to the client on initialize", async () => {
    server = createServer({
      name: "test-http-instructions",
      version: "0.0.0",
      transport: "http",
      instructions: "call check_* before assemble_preview",
      registerTools: registerPing,
    });
    await server.listen(PORT);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(new StreamableHTTPClientTransport(URL_));

    expect(client.getInstructions()).toBe("call check_* before assemble_preview");
    await client.close();
  });

  it("passes real request headers to a tool handler with input", async () => {
    const port = PORT + 1;
    let seen: string | string[] | undefined;
    server = createServer({
      name: "test-http-headers",
      version: "0.0.0",
      transport: "http",
      registerTools: (mcp) =>
        registerTool(mcp, {
          name: "whoami",
          description: "reads a header",
          access: "read",
          input: z.object({}),
          handler: (_args, context) => {
            seen = context.headers["x-user-login"];
            return ok("checked");
          },
        }),
    });
    await server.listen(port);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
        requestInit: { headers: { "X-User-Login": "alice" } },
      }),
    );
    await client.callTool({ name: "whoami", arguments: {} });

    expect(seen).toBe("alice");
    await client.close();
  });

  it("passes real request headers to a tool handler with no input", async () => {
    const port = PORT + 2;
    let seen: string | string[] | undefined;
    server = createServer({
      name: "test-http-headers-no-input",
      version: "0.0.0",
      transport: "http",
      registerTools: (mcp) =>
        registerTool(mcp, {
          name: "whoami",
          description: "reads a header, no args",
          access: "read",
          handler: (context) => {
            seen = context.headers["x-user-login"];
            return ok("checked");
          },
        }),
    });
    await server.listen(port);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`), {
        requestInit: { headers: { "X-User-Login": "bob" } },
      }),
    );
    await client.callTool({ name: "whoami", arguments: {} });

    expect(seen).toBe("bob");
    await client.close();
  });
});
