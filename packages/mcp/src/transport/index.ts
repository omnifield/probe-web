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
  readonly instructions?: string;
  readonly registerTools: (server: McpServer) => void;
  readonly transport?: "stdio" | "http";
  readonly auth?: AuthHook;
  readonly host?: string;
  readonly allowedHosts?: readonly string[];
  readonly allowedOrigins?: readonly string[];
}

export interface ZoneServer {
  listen(port?: number): Promise<void>;
  close(): Promise<void>;
}

export function createServer(options: CreateServerOptions): ZoneServer {
  const {
    name,
    version,
    instructions,
    registerTools,
    transport = "stdio",
    auth,
    host = "127.0.0.1",
    allowedHosts,
    allowedOrigins,
  } = options;

  const buildServer = (): McpServer => {
    const server = new McpServer({ name, version }, instructions ? { instructions } : undefined);
    registerTools(server);
    return server;
  };

  let httpServer: HttpServer | undefined;
  let stdioServer: McpServer | undefined;
  const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>();

  const listen = async (port = 3000): Promise<void> => {
    if (transport === "stdio") {
      stdioServer = buildServer();
      await stdioServer.connect(new StdioServerTransport());
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const server = createHttpServer((req, res) => {
        void handle(req, res);
      });
      httpServer = server;

      // Без этого слушателя ошибка старта (порт занят и т.п.) — необработанное событие EventEmitter:
      // Node валит весь процесс сырым стектрейсом, а listen() зависает, ничего не решив. once — сюда
      // же прилетело бы и после успешного старта событие 'error' у уже слушающего сервера, но тогда
      // reject() на уже подтверждённый (через resolve) промис — просто no-op, второй раз он не сработает.
      server.once("error", (cause: NodeJS.ErrnoException) => {
        const why = cause.code === "EADDRINUSE" ? `порт ${port} уже занят другим процессом` : cause.message;
        reject(new Error(`MCP HTTP-транспорт не смог подняться на ${host}:${port} — ${why}`, { cause }));
      });

      server.listen(port, host, resolve);

      async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
          if (allowedHosts && !allowedHosts.includes(req.headers.host ?? "")) {
            res.writeHead(400).end();
            return;
          }
          if (allowedOrigins && !allowedOrigins.includes(req.headers.origin ?? "")) {
            res.writeHead(400).end();
            return;
          }
          if (auth && !(await auth(req))) {
            res.writeHead(401).end();
            return;
          }

          const sessionId = req.headers["mcp-session-id"];

          if (typeof sessionId === "string") {
            const existing = sessions.get(sessionId);
            if (!existing) {
              res.writeHead(404).end();
              return;
            }
            await existing.transport.handleRequest(req, res);
            return;
          }

          const server = buildServer();
          const sessionTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sid) => void sessions.set(sid, { server, transport: sessionTransport }),
            onsessionclosed: (sid) => void sessions.delete(sid),
          });
          await server.connect(sessionTransport);
          await sessionTransport.handleRequest(req, res);
        } catch {
          if (!res.headersSent) res.writeHead(500).end();
        }
      }
    });
  };

  const close = async (): Promise<void> => {
    if (stdioServer) await stdioServer.close();
    for (const session of sessions.values()) {
      await session.transport.close();
      await session.server.close();
    }
    sessions.clear();
    if (httpServer) await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
  };

  return { listen, close };
}
