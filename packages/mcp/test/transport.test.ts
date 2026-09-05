import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ok, registerTool } from "../src/index.js";
import { createServer, type ZoneServer } from "../src/transport/index.js";

const PORT = 39781;
const URL_ = new URL(`http://127.0.0.1:${PORT}/mcp`);

let server: ZoneServer | undefined;

afterEach(async () => {
  await server?.close();
  server = undefined;
});

describe("createServer — transport: http", () => {
  it("serves a real tool call over Streamable HTTP when auth is absent", async () => {
    server = createServer({ name: "test-http", version: "0.0.0", transport: "http" });
    registerTool(server, { name: "ping", description: "pong", access: "read", handler: () => ok("pong") });
    await server.listen(PORT);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(new StreamableHTTPClientTransport(URL_));
    const result = await client.callTool({ name: "ping", arguments: {} });

    expect(result.isError).toBe(false);
    await client.close();
  });

  it("rejects with 401 before the request reaches the tool when auth fails", async () => {
    server = createServer({
      name: "test-http-auth",
      version: "0.0.0",
      transport: "http",
      auth: (req) => req.headers.authorization === "Bearer good",
    });
    registerTool(server, { name: "ping", description: "pong", access: "read", handler: () => ok("pong") });
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
    });
    registerTool(server, { name: "ping", description: "pong", access: "read", handler: () => ok("pong") });
    await server.listen(PORT);

    const client = new Client({ name: "test-client", version: "0.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(URL_, { requestInit: { headers: { authorization: "Bearer good" } } }),
    );
    const result = await client.callTool({ name: "ping", arguments: {} });

    expect(result.isError).toBe(false);
    await client.close();
  });
});
