import type { ToolContext } from "@web-core/mcp";
import { z } from "@web-core/io";
import { DEFAULT_TAG, sortTags } from "@web-core/skin/tags";
import { checkTags, presets, type PresetKind } from "../engine";

export const KIND = z.enum(["palette", "form", "outfit", "assembly", "tag"]);
export const looseRecord = z.looseObject({ name: z.string() });

// Личность — заголовком, не словами агента. Платформа ставит X-User-Login на каждый HTTP-запрос
// (агент заголовки не пишет, только аргументы тула — раз он не может подделать заголовок, значит
// не может выдать себя за чужого автора). На stdio (локальные скрипты вроде push-to-prod.mjs, где
// заголовков не бывает вовсе) заголовка нет — тогда работает аргумент author, как раньше.
export function resolveAuthor(context: ToolContext, argumentAuthor: string | undefined): string | undefined {
  const header = context.headers["x-user-login"];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  return fromHeader ?? argumentAuthor;
}

// Владение, не админ: у записи уже есть author — трогать её может только запрос с ТЕМ ЖЕ author,
// не отдельный секрет и не одно защищённое имя на всех. Нет author у существующей записи — никем
// не занята, пишет кто угодно. author приезжает с запросом от платформы, которая уже знает, с каким
// залогиненным юзером говорит — сама эта зона identity не проверяет (см. FAQ.md), только сверяет
// строки, поэтому здесь никогда не было и не будет отдельного секрета вида adminToken.
export async function authorGuard(kind: PresetKind, name: string, nextAuthor: string | undefined): Promise<string | undefined> {
  const existing = await presets.get(kind, name);
  if (!existing) return undefined;

  const currentAuthor = (existing.state as { author?: unknown })["author"];
  if (typeof currentAuthor !== "string") return undefined;

  if (nextAuthor !== currentAuthor) {
    return `"${kind}/${name}" is owned by "${currentAuthor}" — only requests with that author may modify it`;
  }

  return undefined;
}

export async function resolveTags(rawTags: unknown, where = "tags") {
  const requested = Array.isArray(rawTags) ? rawTags.filter((t): t is string => typeof t === "string") : [];
  const tags = sortTags(requested.length > 0 ? requested : [DEFAULT_TAG]);
  return { tags, flaws: await checkTags(tags, where) };
}
