import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// docs/ лежит рядом с src/, не внутри неё — путь считаем от РАСПОЛОЖЕНИЯ этого файла, не от cwd
// процесса (pnpm start зовут из разных мест).
const DOCS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../docs");

// Тот же slug-формат, что у name/kind любой записи службы пресетов — не потому что это тоже
// пресет, а чтобы не пускать в путь ничего, кроме имени файла (traversal через "../" не пройдёт
// уже на этой проверке).
const TOPIC_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

function titleOf(markdown: string): string {
  const firstLine = markdown.split("\n", 1)[0] ?? "";
  return firstLine.replace(/^#+\s*/, "").trim();
}

export interface DocSummary {
  readonly topic: string;
  readonly title: string;
}

export async function listDocs(): Promise<DocSummary[]> {
  const entries = await readdir(DOCS_DIR).catch(() => []);
  const files = entries.filter((name) => name.endsWith(".md"));

  const docs = await Promise.all(
    files.map(async (name): Promise<DocSummary> => {
      const topic = name.slice(0, -3);
      const content = await readFile(join(DOCS_DIR, name), "utf8");
      return { topic, title: titleOf(content) };
    }),
  );

  return docs.toSorted((a, b) => a.topic.localeCompare(b.topic));
}

export async function getDoc(topic: string): Promise<string | undefined> {
  if (!TOPIC_PATTERN.test(topic)) return undefined;

  try {
    return await readFile(join(DOCS_DIR, `${topic}.md`), "utf8");
  } catch {
    return undefined;
  }
}
