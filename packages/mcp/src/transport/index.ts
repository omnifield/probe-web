import { randomUUID } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, ServerResponse, Server as HttpServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export type AuthHook = (req: IncomingMessage) => boolean | Promise<boolean>;

export interface CreateServerOptions {
  readonly name: string;
  readonly version: string;
  readonly transport?: "stdio" | "http";
  readonly auth?: AuthHook;
}

export type ZoneServer = McpServer & {
  listen(port?: number): Promise<void>;
  close(): Promise<void>;
};

export function createServer(options: CreateServerOptions): ZoneServer {
  const { name, version, transport = "stdio", auth } = options;
  const server = new McpServer({ name, version }) as ZoneServer;
  let httpServer: HttpServer | undefined;

  server.listen = async (port = 3000) => {
    if (transport === "stdio") {
      await server.connect(new StdioServerTransport());
      return;
    }

    const httpTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
    await server.connect(httpTransport);

    await new Promise<void>((resolve) => {
      httpServer = createHttpServer((req, res) => {
        void handle(req, res);
      }).listen(port, resolve);

      async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
          if (auth && !(await auth(req))) {
            res.writeHead(401).end();
            return;
          }
          await httpTransport.handleRequest(req, res);
        } catch {
          if (!res.headersSent) res.writeHead(500).end();
        }
      }
    });
  };

  server.close = async () => {
    await McpServer.prototype.close.call(server);
    if (httpServer) await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
  };

  return server;
}
