
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface Peer {
  readonly callTool: (name: string, args?: Record<string, unknown>) => Promise<CallToolResult>;
  readonly close: () => Promise<void>;
}

export interface PeerInfo {
  readonly name?: string;
  readonly version?: string;
}

export interface StdioPeerOptions extends PeerInfo {
  /**
   * Окружение дочернего процесса. Не задано — SDK сам даёт обрезанный безопасный набор (PATH/HOME/
   * SHELL/...), НЕ весь process.env текущего процесса (supply-chain: чужому/сторонне-установленному
   * процессу — chrome-devtools-mcp через npx — свои секреты не нужны). Передавайте process.env
   * явно только для СВОЕГО доверенного процесса, которому реально нужны его переменные (например
   * второй локальный инстанс зоны, которому иначе не долетят её SKIN_MCP_*-переменные).
   */
  readonly env?: Record<string, string | undefined>;
}

function peerFrom(connect: () => Promise<Client>): Peer {
  let clientPromise: Promise<Client> | undefined;

  const ensure = (): Promise<Client> => {
    if (!clientPromise) clientPromise = connect();
    return clientPromise;
  };

  return {
    callTool: async (name, args) => (await ensure()).callTool({ name, arguments: args }) as Promise<CallToolResult>,
    close: async () => {
      if (!clientPromise) return;
      const client = await clientPromise;
      clientPromise = undefined;
      await client.close();
    },
  };
}

// Точечный обмен между двумя инстансами зон по HTTP — та же половина картины, что уже даёт
// createServer(transport:"http") в ../transport, только с другой стороны провода: не поднять
// сервер, а подключиться к чужому клиентом. Ленивое подключение — на первый callTool, не раньше:
// не открывать соединение, которым, может, не воспользуются вовсе.
export function httpPeer(url: string, info: PeerInfo = {}): Peer {
  return peerFrom(async () => {
    const client = new Client({ name: info.name ?? "web-core-mcp-peer", version: info.version ?? "0.0.0" });
    await client.connect(new StreamableHTTPClientTransport(new URL(url)));
    return client;
  });
}

// Точечный обмен с процессом, который сам говорит MCP по stdio (например chrome-devtools-mcp) —
// тот же ленивый принцип: процесс запускается на первый реальный вызов, не при объявлении peer.
export function stdioPeer(command: string, args: readonly string[] = [], options: StdioPeerOptions = {}): Peer {
  return peerFrom(async () => {
    const client = new Client({ name: options.name ?? "web-core-mcp-peer", version: options.version ?? "0.0.0" });
    const env = options.env ? definedOnly(options.env) : undefined;
    await client.connect(new StdioClientTransport({ command, args: [...args], ...(env ? { env } : {}) }));
    return client;
  });
}

function definedOnly(env: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) if (value !== undefined) result[key] = value;
  return result;
}
