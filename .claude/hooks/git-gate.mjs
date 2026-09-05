#!/usr/bin/env node
// git-gate.mjs — PreToolUse hook: гейт на write-операции git/gh. Уровень доступа —
// ДАННЫЕ из `.claude/harness.yaml` (config.git[role]): architect=full / owner=commit-only /
// layer=none. Роль-семантика (ЧТО режет каждый уровень) — рамка (инвариант).
//
// Несколько owner-сессий могут работать в одном shared working tree (одна .git).
// Неконтролируемая смена HEAD / push размазывает работу соседей. Промпт под нагрузкой
// игнорится — это hard-gate (owner/layer: deny) либо форс-вопрос (architect: ask).
//
// `full` НЕ ЗНАЧИТ «без вопросов» (постановка user, 2026-08-31, после того как несколько
// параллельных/резюмнутых architect-сессий — маркер держит последние 20 id одновременно —
// молча меняли ветки друг у друга в одном shared working tree: «никто из агентов не смеет
// трогать гит кроме чтения без моего разрешения»). Рамка `architect: full` не снята — гейт не
// БЛОКИРУЕТ architect структурно, — но каждая запись в shared `.git` (switch/checkout/merge/
// rebase/push/reset --hard/branch -D/worktree add/commit/add/gh pr write) ставит РЕАЛЬНЫЙ
// вопрос человеку (`permissionDecision: "ask"`), поверх любого режима разрешений сессии, в том
// числе auto-accept. Чтение (status/log/diff/show/fetch и т.п.) вопросов не ставит — не в
// перечне запрещённых глаголов ни у одной роли.
//
// Контракт (Claude Code PreToolUse):
//   stdin  = JSON { tool_name, tool_input:{command}, session_id, cwd, ... }
//   stdout = JSON { hookSpecificOutput:{ hookEventName, permissionDecision, permissionDecisionReason } }
//   permissionDecision: "allow" | "ask" | "deny" — "ask" форсирует запрос у человека даже под
//   auto-accept сессии, "deny" отказывает без вопроса.
//   exit 0 всегда; FAIL-OPEN на внутренних ошибках.
//
// Уровень доступа сессии:
//   - marker `.claude/.main-session-id` содержит session_id → architect → 'full' (чтение —
//     allow, запись — ask). Marker — ЕДИНСТВЕННЫЙ источник 'full' (subagents наследуют env
//     scope=main, но в marker их нет → не получают full). Пишет marker только
//     main-session-marker.mjs при scope 'main'.
//   - иначе env WEBCORE_SCOPE → config.git[roleOf(scope)]. Пусто/main без marker (=subagent)
//     → commit-only (gated), НЕ full.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { argv } from "node:process";
import { fileURLToPath } from "node:url";
import { gitAccess, loadConfig } from "./harness-config.mjs";

function allow() {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" },
    }),
  );
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

/**
 * Третий вердикт (не allow/deny) — форсирует вопрос ЧЕЛОВЕКУ прямо в моменте, поверх любого
 * режима разрешений сессии (в том числе auto-accept). Только для `access === "full"` —
 * architect не заблокирован структурно (рамка `git.architect: full` не снята), но запись в
 * shared `.git` без явного «да» от user'а больше не проходит тихо (постановка user, 2026-08-31:
 * «никто из агентов не смеет трогать гит кроме чтения без моего разрешения»).
 */
function ask(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

// --- ГРАНИЦА: какие операции считаются git-записью ( её НЕ двигает) --------
// Раньше граница была набором регулярок по всей строке команды, и это ловило git-команду,
// УПОМЯНУТУЮ в данных (тело heredoc, аргумент curl'а, текст коммит-сообщения) наравне с
// настоящим вызовом. Теперь тот же набор выражен таблицей «verb → запрещено ли», а к ней
// подводит разбор команды (ниже). Состав запретов не изменился — изменилось распознавание.

/** commit-only: verb → метка запрета (или null, если этот вызов проходит). */
const COMMIT_ONLY_VERBS = {
  switch: () => "git switch",
  push: () => "git push",
  merge: () => "git merge",
  rebase: () => "git rebase",
  checkout: (args) => {
    if (args.includes("-b")) return "git checkout -b";
    // path-restore (`git checkout -- file`) — не смена HEAD, пускается.
    if (args.includes("--")) return null;
    return "git checkout <branch>";
  },
  reset: (args) =>
    args.some((a) => a === "--hard" || a === "--keep") ? "git reset --hard/--keep" : null,
  branch: (args) =>
    args.some((a) => ["-D", "-f", "-m", "-M"].includes(a)) ? "git branch -D/-f/-m" : null,
  worktree: (args) =>
    ["add", "remove", "move"].includes(args[0]) ? "git worktree add/remove/move" : null,
};

/** none (layer): git не трогает вообще — сверх commit-only режется ещё и это. */
const NONE_EXTRA_VERBS = {
  commit: () => "git commit",
  add: () => "git add",
  tag: () => "git tag",
  stash: () => "git stash",
};

/** gh: единственная запись, которая нас касается — операции над PR. */
const GH_VERBS = {
  pr: (args) =>
    ["create", "merge", "close", "reopen", "edit"].includes(args[0]) ? "gh pr write" : null,
};

// Global-опции git ПЕРЕД verb'ом; часть из них съедает следующий токен (git -C path push).
const GIT_OPTS_WITH_VALUE = new Set(["-C", "-c", "--git-dir", "--work-tree", "--exec-path"]);

// Слова, за которыми может прятаться другая команда: интерпретаторы и обёртки. Их аргументы
// разбирать честно мы не беремся (у каждой обёртки своя грамматика опций), поэтому по такому
// сегменту проходим ГРУБОЙ сетью — ищем любое вхождение git/gh. Ложное срабатывание внутри
// такого сегмента лучше пропущенной записи: цена ошибки двусторонняя, и здесь мы выбираем
// закрытую дверь (`bash -c '<git-запись>'` обязан резаться).
const WRAPPER_WORDS = new Set([
  "bash",
  "sh",
  "zsh",
  "dash",
  "ksh",
  "fish",
  "eval",
  "exec",
  "source",
  ".",
  "xargs",
  "env",
  "sudo",
  "su",
  "ssh",
  "nohup",
  "timeout",
  "time",
  "command",
  "watch",
  "stdbuf",
]);

/** Базовое имя команды: `/usr/bin/git` → `git`. */
function baseName(token) {
  return token.replace(/^.*\//, "");
}

/**
 * Токенизация сегмента: разбивает по пробелам и СНИМАЕТ кавычки. Снятие кавычек здесь
 * безопасно и нужно: сегмент уже опознан как вызов, и `git 'push'` обязан читаться как
 * `git push`, иначе кавычка вокруг verb'а стала бы дырой.
 */
export function tokenize(text) {
  const tokens = [];
  let cur = "";
  let started = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) {
      cur += text[i + 1];
      started = true;
      i += 2;
    } else if (ch === "'" || ch === '"') {
      const end = text.indexOf(ch, i + 1);
      cur += end === -1 ? text.slice(i + 1) : text.slice(i + 1, end);
      started = true;
      i = end === -1 ? text.length : end + 1;
    } else if (/\s/.test(ch)) {
      if (started) tokens.push(cur);
      cur = "";
      started = false;
      i += 1;
    } else {
      cur += ch;
      started = true;
      i += 1;
    }
  }
  if (started) tokens.push(cur);
  return tokens;
}

/** Первое слово сегмента (ведущие присваивания `VAR=val` пропускаются). */
export function commandWord(segment) {
  for (const token of tokenize(segment)) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) continue;
    return baseName(token);
  }
  return "";
}

/**
 * Один вызов git/gh, начиная с токена `git`/`gh`: пропускает global-опции и отдаёт
 * `{ tool, verb, args }`. `git` без verb'а (`git`, `git --version`) → verb пуст, запретов нет.
 */
function readInvocation(tokens, start) {
  const tool = baseName(tokens[start]);
  let i = start + 1;
  while (i < tokens.length && tokens[i].startsWith("-")) {
    if (GIT_OPTS_WITH_VALUE.has(tokens[i])) i += 1;
    i += 1;
  }
  return { tool, verb: tokens[i] ?? "", args: tokens.slice(i + 1) };
}

/**
 * Разбор строки на ИСПОЛНЯЕМЫЕ сегменты с учётом кавычек. Возвращает `null`, если разобрать
 * не удалось — тогда зовущий смотрит строку целиком (fail-safe в сторону закрытой двери).
 * Содержимое подстановок (`$(…)`, backticks) — исполняемое, поэтому вынимается отдельными
 * сегментами; внутри одинарных кавычек подстановок не бывает, там всё литерал.
 */
function collectSegments(text, out, depth = 0) {
  if (depth > 4) return false;
  let cur = "";
  let i = 0;
  const flush = () => {
    if (cur.trim()) out.push(cur);
    cur = "";
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) {
      cur += text.slice(i, i + 2);
      i += 2;
    } else if (ch === "'") {
      const end = text.indexOf("'", i + 1);
      if (end === -1) return false;
      cur += text.slice(i, end + 1);
      i = end + 1;
    } else if (ch === '"') {
      const end = closingDouble(text, i);
      if (end === -1) return false;
      // Внутри двойных кавычек исполняется ТОЛЬКО подстановка — её и вынимаем.
      if (!collectSubstitutions(text.slice(i + 1, end), out, depth)) return false;
      cur += text.slice(i, end + 1);
      i = end + 1;
    } else if (ch === "$" && text[i + 1] === "(") {
      const end = closingParen(text, i + 1);
      if (end === -1) return false;
      if (!collectSegments(text.slice(i + 2, end), out, depth + 1)) return false;
      cur += " ";
      i = end + 1;
    } else if (ch === "`") {
      const end = text.indexOf("`", i + 1);
      if (end === -1) return false;
      if (!collectSegments(text.slice(i + 1, end), out, depth + 1)) return false;
      cur += " ";
      i = end + 1;
    } else if (";|&\n()".includes(ch)) {
      flush();
      i += 1;
    } else {
      cur += ch;
      i += 1;
    }
  }
  flush();
  return true;
}

/** Внутри двойных кавычек нас интересуют только подстановки — остальное литерал. */
function collectSubstitutions(inner, out, depth) {
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === "\\") {
      i += 2;
    } else if (inner[i] === "$" && inner[i + 1] === "(") {
      const end = closingParen(inner, i + 1);
      if (end === -1) return false;
      if (!collectSegments(inner.slice(i + 2, end), out, depth + 1)) return false;
      i = end + 1;
    } else if (inner[i] === "`") {
      const end = inner.indexOf("`", i + 1);
      if (end === -1) return false;
      if (!collectSegments(inner.slice(i + 1, end), out, depth + 1)) return false;
      i = end + 1;
    } else {
      i += 1;
    }
  }
  return true;
}

/** Индекс закрывающей `"` с учётом экранирования и вложенных `$(…)`. */
function closingDouble(text, open) {
  let i = open + 1;
  while (i < text.length) {
    if (text[i] === "\\") i += 2;
    else if (text[i] === "$" && text[i + 1] === "(") {
      const end = closingParen(text, i + 1);
      if (end === -1) return -1;
      i = end + 1;
    } else if (text[i] === '"') return i;
    else i += 1;
  }
  return -1;
}

/** Индекс парной `)` для `(` в позиции `open`. */
function closingParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "\\") i += 1;
    else if (text[i] === "(") depth += 1;
    else if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const HEREDOC_RX = /<<-?\s*(["']?)([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n([\s\S]*?)\n[ \t]*\2(?=\n|$)/g;

/**
 * Тело heredoc — ДАННЫЕ и вырезается… кроме случая, когда его читает интерпретатор: тогда
 * тело и есть программа (`bash <<'EOF' … EOF`). Владельца определяем по команде той строки,
 * где стоит `<<`. Ради этого разбора задача и заводилась: `python3 - <<'PY' …` не должен
 * ловиться на git-команду, упомянутую в передаваемом тексте.
 */
export function stripHeredocBodies(cmd) {
  return cmd.replace(HEREDOC_RX, (match, _quote, _delim, body) => {
    const lineStart = cmd.lastIndexOf("\n", cmd.indexOf(match)) + 1;
    const opener = cmd.slice(lineStart, cmd.indexOf(match));
    const lastSegment = opener.split(/[;|&]/).pop() ?? opener;
    if (WRAPPER_WORDS.has(commandWord(lastSegment))) return match; // тело читает интерпретатор
    return match.replace(body, "");
  });
}

/**
 * Вызовы git/gh в команде: `[{ tool, verb, args }]`. Сегмент, чья команда — не git/gh и не
 * обёртка, игнорируется целиком: его аргументы это данные, а не наши операции.
 */
export function gitInvocations(cmd) {
  const segments = [];
  if (!collectSegments(stripHeredocBodies(cmd), segments)) {
    // Не разобрали (незакрытая кавычка/подстановка) — грубая сеть по всей строке.
    return scanAll(tokenize(cmd));
  }
  const found = [];
  for (const segment of segments) {
    const tokens = tokenize(segment);
    const word = commandWord(segment);
    if (word === "git" || word === "gh") {
      found.push(
        readInvocation(
          tokens,
          tokens.findIndex((t) => baseName(t) === word),
        ),
      );
    } else if (WRAPPER_WORDS.has(word)) {
      found.push(...scanAll(tokens));
    }
  }
  return found;
}

/**
 * Грубая сеть: любое вхождение токена git/gh считается вызовом. Для обёрток и fail-safe.
 * Токены дополнительно рассыпаются по пробелам: у обёртки программа приезжает ОДНИМ
 * аргументом (`bash -c 'git push'` → токен `git push`), и без этого сеть его не увидит.
 */
function scanAll(tokens) {
  const flat = tokens.flatMap((t) => t.split(/\s+/)).filter(Boolean);
  const found = [];
  for (let i = 0; i < flat.length; i++) {
    const base = baseName(flat[i]);
    if (base === "git" || base === "gh") found.push(readInvocation(flat, i));
  }
  return found;
}

/**
 * Причина ограничения под уровень доступа, либо null.
 *
 * `full` больше не выходит рано: он размечается ТЕМ ЖЕ, самым широким набором глаголов, что и
 * `none` (`COMMIT_ONLY_VERBS` + `NONE_EXTRA_VERBS` + `GH_VERBS`) — architect не заблокирован
 * структурно, но каждая запись в shared `.git` должна быть НАЗВАНА, чтобы вызывающий (`main`)
 * решил, спросить о ней (`full`) или отказать (`owner`/`layer`).
 */
export function blockReason(cmd, access) {
  const gitVerbs =
    access === "commit-only" ? COMMIT_ONLY_VERBS : { ...COMMIT_ONLY_VERBS, ...NONE_EXTRA_VERBS };
  for (const { tool, verb, args } of gitInvocations(cmd)) {
    const table = tool === "gh" ? GH_VERBS : gitVerbs;
    const label = table[verb]?.(args);
    if (label) return label;
  }
  return null;
}

function buildMessage(cmd, label, access) {
  return [
    `❌ Команда \`${cmd}\` заблокирована harness-хуком (git-gate, доступ: ${access}).`,
    "",
    `Причина: \`${label}\` вне прав твоей роли на shared \`.git\`.`,
    "",
    "Действие: STOP. Не пытайся обойти: гейт разбирает команду, а не ищет подстроку —",
    "`bash -c`, кавычки вокруг verb'а, подстановка и heredoc для интерпретатора видны ему все.",
    "Верни state architect. Architect либо сделает операцию сам, либо выдаст отдельный worktree.",
  ].join("\n");
}

/** Вопрос человеку (не агенту) — architect на записи в shared `.git`, постановка user 2026-08-31. */
function buildAskMessage(cmd, label) {
  return [
    `Команда \`${cmd}\` — запись в shared \`.git\` (\`${label}\`).`,
    "Разрешить именно эту операцию?",
  ].join("\n");
}

function isMainSession(input) {
  const sessionId = input?.session_id;
  if (!sessionId) return false;
  const cwd = input.cwd || process.cwd();
  try {
    const ids = readFileSync(join(cwd, ".claude", ".main-session-id"), "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return ids.includes(String(sessionId));
  } catch {
    return false;
  }
}

/** Уровень доступа сессии: marker→full; env-scope→config.git; subagent/пусто→commit-only. */
export function currentAccess(input, config) {
  if (isMainSession(input)) return "full";
  const scope = process.env.WEBCORE_SCOPE;
  if (!scope || scope === "main") return config?.git?.owner ?? "commit-only";
  return gitAccess(scope, config);
}

function main() {
  let input;
  try {
    // strip BOM: Windows-пайпы (PowerShell) могут префиксовать stdin — не повод для fail-open.
    input = JSON.parse(readFileSync(0, "utf8").replace(/^﻿/, ""));
  } catch {
    return allow();
  }
  // Оба shell-тула харнесса (дыра PowerShell-пути найдена 2026-07-09).
  if (input.tool_name !== "Bash" && input.tool_name !== "PowerShell") return allow();

  const cmd = String(input.tool_input?.command ?? "");
  if (!cmd) return allow();

  const config = loadConfig(input.cwd || process.cwd());
  const access = currentAccess(input, config);
  const reason = blockReason(cmd, access);
  if (!reason) return allow();
  if (access === "full") return ask(buildAskMessage(cmd, reason));
  deny(buildMessage(cmd, reason, access));
}

// Исполняем main() ТОЛЬКО как скрипт (node git-gate.mjs) — при import (тесты) main не
// запускается: он читает stdin(0) и блокировал бы импортёра.
if (fileURLToPath(import.meta.url) === argv[1]) {
  try {
    main();
  } catch {
    // FAIL-OPEN: внутренняя ошибка хука не должна ломать read-only команды.
    allow();
  }
}
