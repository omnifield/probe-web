import { createMCPClient } from "@tanstack/ai-mcp";
import { stdioTransport } from "@tanstack/ai-mcp/stdio";
import type { MCPClient } from "@tanstack/ai-mcp";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Замена `@web-core/mcp/peer` (`httpPeer`/`stdioPeer`) на `@tanstack/ai-mcp` — та же форма
 * (`Peer`/`PeerInfo`/`StdioPeerOptions`, те же имена функций), чтобы переключение потребителя было
 * сменой импорта, а не переписыванием (см. ROADMAP.yaml, `peer-replaced-by-ai-mcp-client`).
 * `[Symbol.asyncDispose]` — то, чего у оригинала не было: `MCPClient` уже несёт его, `await using`
 * достаётся бесплатно.
 */
export interface Peer {
  readonly callTool: (name: string, args?: Record<string, unknown>) => Promise<CallToolResult>;
  readonly close: () => Promise<void>;
  readonly [Symbol.asyncDispose]: () => Promise<void>;
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
   * явно только для СВОЕГО доверенного процесса, которому реально нужны его переменные.
   */
  readonly env?: Record<string, string | undefined>;
}

function peerFrom(connect: () => Promise<MCPClient>): Peer {
  let clientPromise: Promise<MCPClient> | undefined;

  const ensure = (): Promise<MCPClient> => {
    if (!clientPromise) clientPromise = connect();
    return clientPromise;
  };

  const close = async (): Promise<void> => {
    if (!clientPromise) return;
    const client = await clientPromise;
    clientPromise = undefined;
    await client.close();
  };

  return {
    callTool: async (name, args) => (await ensure()).callTool(name, args) as Promise<CallToolResult>,
    close,
    [Symbol.asyncDispose]: close,
  };
}

// Точечный обмен между двумя инстансами зон по HTTP — та же половина картины, что уже даёт
// createServer(transport:"http") в @web-core/mcp/transport, только с другой стороны провода.
// Ленивое подключение (`createMCPClient` зовётся только внутри `connect`, вызываемого `ensure()`
// на первый `callTool`) — не открывать соединение, которым, может, не воспользуются вовсе.
export function httpPeer(url: string, info: PeerInfo = {}): Peer {
  return peerFrom(() =>
    createMCPClient({
      transport: { type: "http", url },
      name: info.name ?? "web-core-mcp-peer",
      version: info.version ?? "0.0.0",
    }),
  );
}

// Точечный обмен с процессом, который сам говорит MCP по stdio (например chrome-devtools-mcp) —
// тот же ленивый принцип: процесс запускается на первый реальный вызов, не при объявлении peer.
export function stdioPeer(command: string, args: readonly string[] = [], options: StdioPeerOptions = {}): Peer {
  return peerFrom(() =>
    createMCPClient({
      transport: stdioTransport({
        command,
        args: [...args],
        ...(options.env ? { env: definedOnly(options.env) } : {}),
      }),
      name: options.name ?? "web-core-mcp-peer",
      version: options.version ?? "0.0.0",
    }),
  );
}

function definedOnly(env: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) if (value !== undefined) result[key] = value;
  return result;
}
