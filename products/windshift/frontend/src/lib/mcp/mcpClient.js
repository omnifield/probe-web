// Thin client for the product's own built-in MCP server (`/mcp`, mounted in
// internal/mcp/server.go with Stateless: true — no session handshake, every
// call is a standalone JSON-RPC request). Talks the real wire protocol
// instead of a shadow REST copy of the tool registry, so the MCP Console
// exercises exactly what external MCP clients see.

let nextId = 1;

async function rpc(token, method, params) {
  const res = await fetch('/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`MCP request failed (${res.status}): ${raw || res.statusText}`);
  }

  // Streamable HTTP frames single responses as SSE ("event: message\ndata: {...}");
  // fall back to the raw body in case a future change returns plain JSON.
  const dataLine = raw.split('\n').find((line) => line.startsWith('data:'));
  const payload = JSON.parse(dataLine ? dataLine.slice('data:'.length).trim() : raw);

  if (payload.error) {
    throw new Error(payload.error.message || 'MCP call failed');
  }
  return payload.result;
}

export async function listTools(token) {
  const result = await rpc(token, 'tools/list');
  return result?.tools ?? [];
}

export async function callTool(token, name, args) {
  const result = await rpc(token, 'tools/call', { name, arguments: args });
  const text = result?.content?.find((c) => c.type === 'text')?.text ?? '';
  let parsed = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Non-JSON text content is shown as-is.
  }
  return { isError: !!result?.isError, parsed };
}
