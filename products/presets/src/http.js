// Поверхность службы: четыре действия и ни одного больше.
//
//   GET    /api/presets           → { items: [{ id, label, description?, kind?, savedAt }] } — без содержимого
//   GET    /api/presets?kind=skin → то же, но только записи с этим ярлыком вида
//   GET    /api/presets/{id}      → { id, label, description?, kind?, savedAt, state }
//   POST   /api/presets           → { id, label, description?, kind?, savedAt }              — 201
//   DELETE /api/presets/{id}      → 204
//
// Проверяется здесь ТОЛЬКО конверт: имя, пояснение, ярлык вида, размер. `state` не разбирается —
// он уходит в хранилище тем же куском JSON, каким пришёл (`kb:PROBEWEB-8`). Отказ по существу
// состояния (чужая версия формата, неизвестный оператор) — работа читателя, у него для этого
// есть `parseFilter`; служба про это не знает.

import { askForPreset, createGuard } from "./agent.js";
import { AGENT_LIMITS, LIMITS } from "./limits.js";
import { StorageFull } from "./store.js";
import { trace } from "./trace.js";

/**
 * Заголовки для чужого источника. Авторизации у службы нет по решению user — пресеты общие,
 * писать может любой, кто знает адрес. Значит и запрещать чужому источнику нечего: CORS не
 * охрана, а согласие браузера, и без него стенд с дев-сервера просто не достучится.
 *
 * @type {Record<string, string>}
 */
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type",
  "access-control-max-age": "86400",
};

const ROOT = "/api/presets";

/**
 * Форма ЯРЛЫКА ВИДА (`kind`) — того же строгого покроя, что и идентификатор записи: короткая
 * строка, годная и для адреса, и для имени. Ярлык ездит в строке запроса (`?kind=skin`) и им же
 * помечают вид данных, поэтому пробелы, косые, точки и регистр здесь только вредят: адрес
 * пришлось бы экранировать, а `Skin` и `skin` разошлись бы в два вида, которых один.
 *
 * Проверяется ФОРМА, а не смысл. Служба не знает и не хочет знать, что значит `skin`, и не
 * держит перечня допустимых ярлыков: новый вид заводится владельцем без единой правки здесь
 * (`kb:PROBEWEB-8`). Тридцать два символа — с запасом на любое осмысленное имя вида.
 */
const KIND = /^[a-z0-9][a-z0-9-]{0,31}$/;

/**
 * Текст отказа по ярлыку — один и на запись, и на отбор: причина у них одна, прислана строка,
 * которой ярлык быть не может.
 */
const BAD_KIND =
  "Вид пресета — короткая метка из строчных латинских букв, цифр и дефисов (до 32 символов), например skin.";

/** Канал к агенту — вторая волна, контракт `kb:PROBEWEB-9`. */
const AGENT_ROOT = "/api/agent/preset";

/**
 * @param {import("node:http").ServerResponse} res
 * @param {number} status
 * @param {unknown} [payload]
 */
function send(res, status, payload) {
  if (payload === undefined) {
    res.writeHead(status, CORS);
    res.end();
    return;
  }
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...CORS,
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * Отказ — внятным телом и осмысленным кодом, а не пятисоткой на всё подряд.
 *
 * `error` — для кода читателя (его не переводят и не показывают), `message` — для человека:
 * стенд показывает эту строку как есть, поэтому она написана по-русски и говорит, что делать.
 *
 * @param {import("node:http").ServerResponse} res
 * @param {number} status
 * @param {string} code
 * @param {string} message
 */
function fail(res, status, code, message) {
  send(res, status, { error: code, message });
}

/**
 * Прочитать тело, не дав ему вырасти сверх предела.
 *
 * Считаем НАКОПЛЕННОЕ, а не объявленную длину. `content-length` пишет клиент, и предел, стоящий
 * на нём, обходится одной строкой заголовка или вовсе отсутствует (тело по частям). Отдельной
 * ранней проверки по заголовку здесь сознательно НЕТ: она ничего не добавляет к пределу (читаем
 * мы в любом случае не больше `maxBytes`), но заводит вторую ветку поведения, которую нечем
 * заставить упасть, — а непроверяемая ветка это не защита, а место для будущей ошибки.
 *
 * @param {import("node:http").IncomingMessage} req
 * @param {number} maxBytes
 * @returns {Promise<{ ok: true, text: string } | { ok: false, reason: "too_large" }>}
 */
function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    let size = 0;
    let stopped = false;

    req.on("data", (chunk) => {
      if (stopped) return;
      size += chunk.length;
      if (size > maxBytes) {
        // Дочитывать незачем, но и рвать соединение нельзя: оборванный сокет уносит с собой
        // ответ, и клиент вместо внятного отказа получает «сеть отвалилась».
        stopped = true;
        req.pause();
        resolve({ ok: false, reason: "too_large" });
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve({ ok: true, text: Buffer.concat(chunks).toString("utf8") }));
    req.on("error", reject);
  });
}

/**
 * Разобрать конверт сохранения. Внутрь `state` не смотрим: его тип не проверяется вообще —
 * число, строка, массив и заведомая чушь одинаково законны.
 *
 * @param {unknown} body
 * @param {Readonly<import("./limits.js").Limits>} limits
 * @returns {{ ok: true, value: { label: string, description?: string, kind?: string, state: unknown } }
 *          | { ok: false, code: string, message: string }}
 */
function parseEnvelope(body, limits) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, code: "bad_request", message: "Ожидался объект с полями label и state." };
  }
  const input = /** @type {Record<string, unknown>} */ (body);

  // Имя обязательно: список без названий бесполезен, выбирают из него по имени.
  if (typeof input["label"] !== "string" || input["label"].trim() === "") {
    return { ok: false, code: "label_required", message: "У пресета должно быть имя." };
  }
  const label = input["label"].trim();
  if ([...label].length > limits.labelChars) {
    return {
      ok: false,
      code: "label_too_long",
      message: `Имя длиннее ${limits.labelChars} символов.`,
    };
  }

  // Пояснения может не быть вовсе, и это нормальная запись, а не ущербная.
  /** @type {string | undefined} */
  let description;
  const raw = input["description"];
  if (raw !== undefined && raw !== null) {
    if (typeof raw !== "string") {
      return { ok: false, code: "bad_description", message: "Пояснение должно быть строкой." };
    }
    if ([...raw].length > limits.descriptionChars) {
      return {
        ok: false,
        code: "description_too_long",
        message: `Пояснение длиннее ${limits.descriptionChars} символов.`,
      };
    }
    // Пустое пояснение и отсутствующее — одно и то же: поле, забитое пробелом, лучше не хранить.
    if (raw.trim() !== "") description = raw.trim();
  }

  // Ярлык вида НЕОБЯЗАТЕЛЕН, и это не поблажка, а условие совместимости: то, что уже лежит и
  // работает у `tables`, приезжает без него и обязано сохраняться как прежде. Проверяем только
  // форму — что лежит ПОД ярлыком, служба не смотрит.
  /** @type {string | undefined} */
  let kind;
  const rawKind = input["kind"];
  if (rawKind !== undefined && rawKind !== null) {
    if (typeof rawKind !== "string" || !KIND.test(rawKind)) {
      return { ok: false, code: "bad_kind", message: BAD_KIND };
    }
    kind = rawKind;
  }

  if (!("state" in input)) {
    return { ok: false, code: "state_required", message: "Не передано состояние пресета." };
  }

  return {
    ok: true,
    value: {
      label,
      ...(description === undefined ? {} : { description }),
      ...(kind === undefined ? {} : { kind }),
      state: input["state"],
    },
  };
}

/**
 * Собрать обработчик запросов поверх открытого хранилища.
 *
 * Маршруты объявлены таблицей, а не разветвлённым `if`, — не ради красоты: во второй волне
 * сюда встаёт `POST /api/agent/preset`, и он должен добавляться строкой, ничего не задевая.
 *
 * @param {Awaited<ReturnType<typeof import("./store.js").openStore>>} store
 * @param {Readonly<import("./limits.js").Limits>} [limits]
 * @param {{guard?: ReturnType<typeof createGuard>, ask?: typeof askForPreset, apiKey?: string | undefined}} [agent]
 * @returns {import("node:http").RequestListener}
 */
export function createHandler(store, limits = LIMITS, agent = {}) {
  // Канал к агенту собирается здесь, а не в обработчике: счётчик обращений обязан жить между
  // запросами, иначе дневной предел обнуляется на каждом и не значит ничего.
  const channel = {
    guard: agent.guard ?? createGuard(),
    ask: agent.ask ?? askForPreset,
    apiKey: agent.apiKey ?? process.env["ANTHROPIC_API_KEY"],
  };
  return (req, res) => {
    const done = trace(`http ${req.method} ${req.url}`);
    handle(req, res, store, limits, channel)
      .catch((error) => {
        // Неожиданная поломка — единственное место, где уместна пятисотка. Причину пишем в
        // лог целиком, наружу не отдаём: наружу отдаём то, что человеку что-то говорит.
        console.error("[probe-web-presets] сбой запроса:", error);
        if (!res.headersSent) {
          fail(res, 500, "internal", "Служба не смогла обработать запрос.");
        } else {
          res.end();
        }
      })
      .finally(() => done(`→ ${res.statusCode}`));
  };
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @param {Awaited<ReturnType<typeof import("./store.js").openStore>>} store
 * @param {Readonly<import("./limits.js").Limits>} limits
 * @param {{guard: ReturnType<typeof createGuard>, ask: typeof askForPreset, apiKey?: string | undefined}} channel
 */
async function handle(req, res, store, limits, channel) {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", "http://presets.local");
  const path = url.pathname.replace(/\/+$/, "");

  if (method === "OPTIONS") return send(res, 204);

  // Проверка живости: нужна докеру и тому, кто разворачивает. Наружу она не проксируется —
  // за дверью живёт только `/api`.
  if (path === "/healthz") {
    if (method !== "GET") return methodNotAllowed(res, "GET");
    return send(res, 200, { ok: true, presets: store.size, limits });
  }

  if (path === ROOT) {
    if (method === "GET") return list(res, store, url);
    if (method === "POST") return create(req, res, store, limits);
    return methodNotAllowed(res, "GET, POST");
  }

  if (path.startsWith(`${ROOT}/`)) {
    const id = decodeURIComponent(path.slice(ROOT.length + 1));
    if (id === "" || id.includes("/")) return notFound(res);

    if (method === "GET") {
      const record = await store.read(id);
      if (!record) return notFound(res);
      return send(res, 200, record);
    }
    if (method === "DELETE") {
      const removed = await store.remove(id);
      if (!removed) return notFound(res);
      return send(res, 204);
    }
    return methodNotAllowed(res, "GET, DELETE");
  }

  if (path === AGENT_ROOT) {
    if (method !== "POST") return methodNotAllowed(res, "POST");
    return askAgent(req, res, channel);
  }

  return notFound(res);
}

/**
 * Канал к агенту: описание словами → отбор. Контракт — `kb:PROBEWEB-9`.
 *
 * Отказы здесь ВСЕ четырёхсотые, включая «модель не ответила». Причина не в букве кодов, а в
 * том, как их читает стенд: он различает «отказ по делу» и «сервиса нет» по границе 500 и на
 * пятисотке молча уходит в память со словами «сохранено только в этой вкладке». Отказ агента,
 * приехавший пятисоткой, выглядел бы для человека как отказ ХРАНИЛИЩА — при живом хранилище.
 *
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @param {{guard: ReturnType<typeof createGuard>, ask: typeof askForPreset, apiKey?: string | undefined}} channel
 */
async function askAgent(req, res, channel) {
  // Запас к пределу текста: сюда же едет словарь полей, и рубить по длине описания было бы
  // неверно — отказ должен приходить от проверки ниже, с внятной причиной, а не от чтения.
  const body = await readBody(req, AGENT_LIMITS.textChars * 8 + 8192);
  if (!body.ok) {
    res.setHeader("connection", "close");
    return fail(res, 413, "too_large", "Запрос к агенту слишком велик.");
  }

  /** @type {unknown} */
  let input;
  try {
    input = JSON.parse(body.text);
  } catch {
    return fail(res, 400, "bad_json", "Тело запроса — не JSON.");
  }

  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return fail(res, 400, "bad_envelope", "Ожидался объект с полями text и fields.");
  }

  const envelope = /** @type {Record<string, unknown>} */ (input);

  const text = envelope["text"];
  if (typeof text !== "string" || text.trim() === "") {
    return fail(res, 400, "text_required", "Опишите отбор словами — поле не может быть пустым.");
  }
  if (text.length > AGENT_LIMITS.textChars) {
    return fail(
      res,
      400,
      "text_too_long",
      `Описание длиннее ${AGENT_LIMITS.textChars} символов. Сформулируйте короче.`,
    );
  }

  // Словарь полей НЕОБЯЗАТЕЛЕН, и это уступка факту, а не замысел: контракт канала я дописал
  // уже после того, как выдал ТЗ клиенту, и клиент шлёт только текст. Требовать словарь значило
  // бы отказывать на каждом запросе — канал не работал бы вовсе. Без словаря модель угадывает
  // имена полей хуже, и это доводится отдельной задачей на стороне `tables`.
  const raw = envelope["fields"];
  if (
    raw !== undefined &&
    (!Array.isArray(raw) || raw.some(/** @param {unknown} name */ (name) => typeof name !== "string"))
  ) {
    return fail(res, 400, "bad_fields", "Поля таблицы передаются списком строк.");
  }
  /** @type {string[]} */
  const fields = Array.isArray(raw) ? raw : [];
  if (fields.length > AGENT_LIMITS.fieldsCount) {
    return fail(
      res,
      400,
      "fields_too_many",
      `Полей больше ${AGENT_LIMITS.fieldsCount} — столько модели не передаём.`,
    );
  }

  // За дверью адрес соединения один на всех — считать по нему значило бы считать всех как
  // одного. Берём то, что проставила дверь, и только первый адрес цепочки.
  const forwarded = req.headers["x-forwarded-for"];
  const address =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "неизвестно";

  const allowed = channel.guard.check(address);
  if (!allowed.ok) return fail(res, 429, allowed.code, allowed.message);

  const answer = await channel.ask({ text, fields, apiKey: channel.apiKey });
  if (!answer.ok) return fail(res, answer.status, answer.code, answer.message);

  // Отдаём как пришло. Что это за состояние и годится ли оно — решает `parseFilter` у
  // читателя: ответ модели не привилегированнее файла переходника (`kb:PROBEWEB-9`).
  return send(res, 200, { state: answer.state });
}

/**
 * Перечень. `?kind=skin` отбирает записи по ЯРЛЫКУ ВИДА — единственное, что служба с ярлыком
 * делает. Разные виды лежат в одном хранилище (`kb:PROBEWEB-8`), и отдельных путей под них не
 * заводится: путь под вид означал бы, что перечень видов известен службе, и каждый новый вид
 * требовал бы её правки.
 *
 * Ярлык не той формы — отказ, а НЕ пустой перечень. Пустой список читается как «таких записей
 * нет», и опечатка в запросе выглядела бы как чистое хранилище — молчаливая неправда вместо
 * ответа, который говорит, что чинить.
 *
 * @param {import("node:http").ServerResponse} res
 * @param {Awaited<ReturnType<typeof import("./store.js").openStore>>} store
 * @param {URL} url
 */
function list(res, store, url) {
  const asked = url.searchParams.get("kind");
  if (asked === null) return send(res, 200, { items: store.list() });
  if (!KIND.test(asked)) return fail(res, 400, "bad_kind", BAD_KIND);
  return send(res, 200, { items: store.list({ kind: asked }) });
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 * @param {Awaited<ReturnType<typeof import("./store.js").openStore>>} store
 * @param {Readonly<import("./limits.js").Limits>} limits
 */
async function create(req, res, store, limits) {
  const body = await readBody(req, limits.bodyBytes);
  if (!body.ok) {
    // Тело мы не дочитали, поэтому соединение переиспользовать нельзя — на нём остался
    // недочитанный хвост, который следующий запрос принял бы за свой.
    res.setHeader("connection", "close");
    // 413 — про размер ОДНОГО запроса; так это и нормировано (RFC 9110 §15.5.14, сверено
    // 2026-08-13). Клиент чинит это сам: сохраняет отбор поменьше.
    return fail(
      res,
      413,
      "too_large",
      `Пресет больше ${Math.floor(limits.bodyBytes / 1024)} КБ и не сохранён.`,
    );
  }

  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(body.text);
  } catch {
    return fail(res, 400, "bad_json", "Тело запроса — не JSON.");
  }

  const envelope = parseEnvelope(parsed, limits);
  if (!envelope.ok) return fail(res, 400, envelope.code, envelope.message);

  /** @type {import("./store.js").PresetRecord} */
  let record;
  try {
    record = await store.create(envelope.value);
  } catch (error) {
    if (error instanceof StorageFull) {
      // 409, а НЕ 507 — и это решение, а не вкусовщина (сверено 2026-08-13).
      //
      // По букве 507 подходит: «недостаточно места, чтобы записать состояние» (RFC 4918 §11.5).
      // Но 507 это 5xx, а 5xx для читателя значит «сервер сломался». Служба не сломалась: она
      // работает и отказывает по делу, а чинит это человек — удалением лишнего. Ровно так
      // описан 409: конфликт с текущим состоянием ресурса, который клиент способен разрешить и
      // повторить запрос (RFC 9110 §15.5.10).
      //
      // Цена ошибки здесь не теоретическая. Читатель (площадка зоны `tables`) разводит «отказ
      // по делу» и «сервиса нет» по границе 500: всё, что выше, уводит стенд в память со
      // словами «сохранено только в этой вкладке». Отдай мы 5xx — переполненное хранилище
      // выглядело бы для человека как успешное сохранение. Отказ, которого не видно, — не
      // ограничитель.
      return fail(
        res,
        409,
        "storage_full",
        `Сохранено ${error.limit} пресетов — это предел. Удалите ненужные.`,
      );
    }
    throw error;
  }

  res.setHeader("location", `${ROOT}/${record.id}`);
  // Наружу — БЕЗ содержимого: клиент его только что прислал, возвращать незачем.
  const { state: _state, ...meta } = record;
  return send(res, 201, meta);
}

/**
 * @param {import("node:http").ServerResponse} res
 * @param {string} allow
 */
function methodNotAllowed(res, allow) {
  res.setHeader("allow", allow);
  fail(res, 405, "method_not_allowed", `Здесь можно только: ${allow}.`);
}

/** @param {import("node:http").ServerResponse} res */
function notFound(res) {
  fail(res, 404, "not_found", "Такого пресета нет.");
}
