// Разбор строки логики: `(1 И 2) ИЛИ 3` → дерево выражения.
//
// ПРИОРИТЕТ ОПЕРАТОРОВ НАЗВАН ЯВНО: `НЕ` сильнее `И`, `И` сильнее `ИЛИ` — как в SQL и в
// CQL2. Это не самоочевидно: Google AIP-160 сознательно делает ОБРАТНОЕ, у него `ИЛИ`
// связывает сильнее `И`, «чтобы совпасть с речью», и `a И b ИЛИ c` там значит `a И (b ИЛИ c)`.
// Один и тот же текст даёт разный результат в зависимости от свода, поэтому наш выбор
// записан здесь, а не оставлен «как получится у парсера» (фонд canons/filter-tables-graphs,
// gaps/operator-naming-divergence.md).

export type Expr =
  | { t: "ref"; n: number }
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
 * @param count — сколько условий сейчас в списке; ссылка за пределы — ошибка с адресом
 */
export function parseFormula(text: string, count: number): ParseResult {
  const tokens = tokenize(text);
  if (typeof tokens === "string") return { ok: false, error: tokens };
  if (tokens.length === 0) return { ok: false, error: "формула пустая" };

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
      if (token.n < 1 || token.n > count) {
        failure ??=
          count === 0
            ? `условия №${token.n} нет — список условий пуст`
            : `условия №${token.n} нет, сейчас их ${count}`;
        return null;
      }
      return { t: "ref", n: token.n };
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

/** Формула по умолчанию: все условия через И. */
export function defaultFormula(count: number): string {
  return Array.from({ length: count }, (_, index) => String(index + 1)).join(" И ");
}
