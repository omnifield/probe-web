import { type ChildProcess, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Тот же приём, что у `engine/presets.ts`'s `workspaceRoot()` — корень воркспейса по маркеру,
// вверх от места файла (не от cwd процесса тестов).
function workspaceRoot(from: string): string {
  let dir = resolve(from);
  for (;;) {
    if (existsSync(resolve(dir, "pnpm-workspace.yaml"))) return dir;
    const up = dirname(dir);
    if (up === dir)
      throw new Error("pnpm-workspace.yaml not found above " + from);
    dir = up;
  }
}

async function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      const port =
        typeof address === "object" && address ? address.port : undefined;
      srv.close(() => (port ? res(port) : rej(new Error("no port assigned"))));
    });
    srv.on("error", rej);
  });
}

async function waitForReady(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: "{__typename}" }),
      });
      if (res.ok) return;
    } catch (cause) {
      lastError = cause;
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  throw new Error(
    `presets test server never became ready at ${url}: ${String(lastError)}`,
  );
}

export interface TestPresetsServer {
  readonly url: string;
  close(): Promise<void>;
}

// Живой backend/presets (не мок HTTP-клиента) — своя база+порт на процесс, dev-база (db/presets.db)
// не трогается ни разу. `go run` берёт исходник как есть, не протухший бинарник.
export async function spawnTestPresetsServer(): Promise<TestPresetsServer> {
  const root = workspaceRoot(fileURLToPath(import.meta.url));
  const backendDir = join(root, "backend", "presets");
  const dbDir = await mkdtemp(join(tmpdir(), "skin-mcp-presets-test-"));
  const dbPath = join(dbDir, "presets.db");
  const port = await freePort();
  const url = `http://127.0.0.1:${port}/graphql`;

  const child: ChildProcess = spawn("go", ["run", "./cmd/presets"], {
    cwd: backendDir,
    env: {
      ...process.env,
      PRESETS_PORT: String(port),
      PRESETS_HOST: "127.0.0.1",
      PRESETS_DB: dbPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  child.stdout?.on("data", (chunk) => (output += String(chunk)));
  child.stderr?.on("data", (chunk) => (output += String(chunk)));

  const exited = new Promise<void>((_res, rej) => {
    child.once("exit", (code) => {
      if (code !== null && code !== 0)
        rej(
          new Error(`presets test server exited early (${code}):\n${output}`),
        );
    });
  });

  try {
    await Promise.race([waitForReady(url, 20000), exited]);
  } catch (cause) {
    child.kill("SIGTERM");
    throw cause instanceof Error
      ? new Error(`${cause.message}\n\n${output}`)
      : cause;
  }

  return {
    url,
    async close() {
      await new Promise<void>((res) => {
        child.once("exit", () => res());
        child.kill("SIGTERM");
      });
      await rm(dbDir, { recursive: true, force: true });
    },
  };
}
