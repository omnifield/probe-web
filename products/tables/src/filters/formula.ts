// Разбор строки логики: `(1 И 2) ИЛИ 3` → дерево выражения.
//
// ПРИОРИТЕТ ОПЕРАТОРОВ НАЗВАН ЯВНО: `НЕ` сильнее `И`, `И` сильнее `ИЛИ` — как в SQL и в
// CQL2. Это не самоочевидно: Google AIP-160 сознательно делает ОБРАТНОЕ, у него `ИЛИ`
// связывает сильнее `И`, «чтобы совпасть с речью», и `a И b ИЛИ c` там значит `a И (b ИЛИ c)`.
// Один и тот же текст даёт разный результат в зависимости от свода, поэтому наш выбор
// записан здесь, а не оставлен «как получится у парсера» (фонд canons/filter-tables-graphs,
// gaps/operator-naming-divergence.md; сверено 2026-08-11, подтверждено — не меняем).
//
// НОМЕР — ЭТО ВВОД И ПОКАЗ, А НЕ ХРАНЕНИЕ. Пользователь пишет номера, но дерево ссылается на
// устойчивый `id` условия: позиционная ссылка на изменяемый набор неустойчива (цену называет
// RFC 6901), и удаление условия молча меняло смысл сохранённой формулы. Разбор переводит
// номер в `id`, показ — обратно (`tasker:TABLES-4`, раздел B).

/** Узел выражения. `ref` держит `id` условия, а не его номер. */
export type Expr =
  | { t: "ref"; id: string }
  | { t: "not"; a: Expr }
  | { t: "and"; a: Expr; b: Expr }
  | { t: "or"; a: Expr; b: Expr };

export type ParseResult = { ok: true; expr: Expr } | { ok: false; error: string };

type Token =
  | { t: "num"; n: number }
  | { t: "and" }
  | { t: "or" }
  | { t: "not" }
  | { t: "(" }
  | { t: ")" };

const WORDS: Record<string, Token["t"]> = {
  и: "and",
  and: "and",
  или: "or",
  or: "or",
  не: "not",
  not: "not",
};

const SYMBOLS: Record<string, Token["t"]> = {
  "&": "and",
  "|": "or",
  "!": "not",
  "(": "(",
  ")": ")",
};

function tokenize(text: string): Token[] | string {
  const tokens: Token[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i]!;

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let digits = "";
      while (i < text.length && /[0-9]/.test(text[i]!)) {
        digits += text[i];
        i += 1;
      }
      tokens.push({ t: "num", n: Number(digits) });
      continue;
    }

    // `&&` и `||` — тот же оператор, что одиночный знак: пишут и так, и так.
    if (ch === "&" || ch === "|") {
      if (text[i + 1] === ch) i += 1;
      tokens.push({ t: SYMBOLS[ch] } as Token);
      i += 1;
      continue;
    }

    if (ch === "!" || ch === "(" || ch === ")") {
      tokens.push({ t: SYMBOLS[ch] } as Token);
      i += 1;
      continue;
    }

    if (/[a-zA-Zа-яА-ЯёЁ]/.test(ch)) {
      let word = "";
      while (i < text.length && /[a-zA-Zа-яА-ЯёЁ]/.test(text[i]!)) {
        word += text[i];
        i += 1;
      }
      const kind = WORDS[word.toLowerCase()];
      if (!kind) return `непонятное слово «${word}»`;
      tokens.push({ t: kind } as Token);
      continue;
    }

    return `непонятный символ «${ch}»`;
  }

  return tokens;
}

/**
 * Разобрать строку логики.
 *
 * @param text — что написал пользователь
 * @param ids — идентификаторы условий В ПОРЯДКЕ ПОКАЗА: номер `n` означает `ids[n - 1]`
 */
export function parseFormula(text: string, ids: readonly string[]): ParseResult {
  const tokens = tokenize(text);
  if (typeof tokens === "string") return { ok: false, error: tokens };
  if (tokens.length === 0) return { ok: false, error: "формула пустая" };

  const count = ids.length;
  let pos = 0;
  let failure: string | null = null;

  const peek = (): Token | undefined => tokens[pos];

  function parseOr(): Expr | null {
    let left = parseAnd();
    if (left === null) return null;
    while (peek()?.t === "or") {
      pos += 1;
      const right = parseAnd();
      if (right === null) return null;
      left = { t: "or", a: left, b: right };
    }
    return left;
  }

  function parseAnd(): Expr | null {
    let left = parseNot();
    if (left === null) return null;
    while (peek()?.t === "and") {
      pos += 1;
      const right = parseNot();
      if (right === null) return null;
      left = { t: "and", a: left, b: right };
    }
    return left;
  }

  function parseNot(): Expr | null {
    if (peek()?.t === "not") {
      pos += 1;
      const inner = parseNot();
      if (inner === null) return null;
      return { t: "not", a: inner };
    }
    return parsePrimary();
  }

  function parsePrimary(): Expr | null {
    const token = peek();

    if (token === undefined) {
      failure ??= "формула обрывается — не хватает условия";
      return null;
    }

    if (token.t === "num") {
      pos += 1;
      const id = ids[token.n - 1];
      if (id === undefined) {
        failure ??=
          count === 0
            ? `условия №${token.n} нет — список условий пуст`
            : `условия №${token.n} нет, сейчас их ${count}`;
        return null;
      }
      return { t: "ref", id };
    }

    if (token.t === "(") {
      pos += 1;
      const inner = parseOr();
      if (inner === null) return null;
      if (peek()?.t !== ")") {
        failure ??= "не хватает закрывающей скобки";
        return null;
      }
      pos += 1;
      return inner;
    }

    failure ??= "здесь ожидался номер условия или скобка";
    return null;
  }

  const expr = parseOr();
  if (expr === null) return { ok: false, error: failure ?? "формулу не разобрать" };
  if (pos < tokens.length) {
    return {
      ok: false,
      error: peek()?.t === ")" ? "лишняя закрывающая скобка" : "в конце формулы что-то лишнее",
    };
  }

  return { ok: true, expr };
}

const PRIORITY = { or: 1, and: 2, not: 3 } as const;

/**
 * Показать дерево строкой с текущими номерами условий.
 *
 * Условие, на которое ссылка есть, а самого условия уже нет, показывается как `?` — это
 * видимое событие, а не молчаливый сдвиг номеров, ради которого всё и переделывалось.
 */
export function formatFormula(expr: Expr, ids: readonly string[]): string {
  const render = (node: Expr, parentPriority: number): string => {
    switch (node.t) {
      case "ref": {
        const index = ids.indexOf(node.id);
        return index === -1 ? "?" : String(index + 1);
      }
      case "not":
        return `НЕ ${render(node.a, PRIORITY.not)}`;
      case "and": {
        const text = `${render(node.a, PRIORITY.and)} И ${render(node.b, PRIORITY.and)}`;
        return parentPriority > PRIORITY.and ? `(${text})` : text;
      }
      case "or": {
        const text = `${render(node.a, PRIORITY.or)} ИЛИ ${render(node.b, PRIORITY.or)}`;
        return parentPriority > PRIORITY.or ? `(${text})` : text;
      }
    }
  };

  return render(expr, 0);
}

/** Все идентификаторы, на которые ссылается дерево. */
export function referencedIds(expr: Expr): Set<string> {
  const found = new Set<string>();

  const walk = (node: Expr): void => {
    switch (node.t) {
      case "ref":
        found.add(node.id);
        return;
      case "not":
        walk(node.a);
        return;
      case "and":
      case "or":
        walk(node.a);
        walk(node.b);
    }
  };

  walk(expr);
  return found;
}

/**
 * Условия, входящие в формулу ПОД ОТРИЦАНИЕМ.
 *
 * Отрицание у нас живёт в формуле, а не в самом условии: условие говорит «сумма больше ста»,
 * а нужно ли обратное — решает логика сборки. Поэтому строка условия сама не знает, что она
 * отрицаема, и узнать это можно только отсюда.
 *
 * Считается ЧЁТНОСТЬ: `НЕ (НЕ 1)` — это 1, а не отрицание. Двойное отрицание пишут редко, но
 * разбор формулы его допускает, и пометить такое условие отрицаемым значило бы соврать
 * оформлению, которое эту пометку покажет человеку.
 */
export function negatedIds(expr: Expr): Set<string> {
  const found = new Set<string>();

  const walk = (node: Expr, negated: boolean): void => {
    switch (node.t) {
      case "ref":
        if (negated) found.add(node.id);
        return;
      case "not":
        walk(node.a, !negated);
        return;
      case "and":
      case "or":
        walk(node.a, negated);
        walk(node.b, negated);
    }
  };

  walk(expr, false);
  return found;
}

/** Ссылки на условия, которых больше нет. Пусто — формула цела. */
export function danglingIds(expr: Expr, ids: readonly string[]): string[] {
  return [...referencedIds(expr)].filter((id) => !ids.includes(id));
}

/** Переписать идентификаторы в дереве — при клоне пресета или подстановке шаблона. */
export function remapIds(expr: Expr, mapping: ReadonlyMap<string, string>): Expr {
  switch (expr.t) {
    case "ref":
      return { t: "ref", id: mapping.get(expr.id) ?? expr.id };
    case "not":
      return { t: "not", a: remapIds(expr.a, mapping) };
    case "and":
      return { t: "and", a: remapIds(expr.a, mapping), b: remapIds(expr.b, mapping) };
    case "or":
      return { t: "or", a: remapIds(expr.a, mapping), b: remapIds(expr.b, mapping) };
  }
}

/** Дерево «все условия через И». `null`, когда условий нет. */
export function defaultExpr(ids: readonly string[]): Expr | null {
  if (ids.length === 0) return null;

  return ids
    .slice(1)
    .reduce<Expr>((left, id) => ({ t: "and", a: left, b: { t: "ref", id } }), {
      t: "ref",
      id: ids[0]!,
    });
}

/** Формула по умолчанию строкой: все условия через И. Для показа и как заготовка ввода. */
export function defaultFormula(count: number): string {
  return Array.from({ length: count }, (_, index) => String(index + 1)).join(" И ");
}
