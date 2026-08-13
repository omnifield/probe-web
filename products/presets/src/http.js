// Поверхность службы: четыре действия и ни одного больше.
//
//   GET    /api/presets       → { items: [{ id, label, description?, savedAt }] }  — без содержимого
//   GET    /api/presets/{id}  → { id, label, description?, savedAt, state }
//   POST   /api/presets       → { id, label, description?, savedAt }               — 201
//   DELETE /api/presets/{id}  → 204
//
// Проверяется здесь ТОЛЬКО конверт: имя, пояснение, размер. `state` не разбирается вовсе —
// он уходит в хранилище тем же куском JSON, каким пришёл (`kb:PROBEWEB-8`). Отказ по существу
// состояния (чужая версия формата, неизвестный оператор) — работа читателя, у него для этого
// есть `parseFilter`; служба про это не знает.

import { LIMITS } from "./limits.js";
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
 * @returns {{ ok: true, value: { label: string, description?: string, state: unknown } }
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

  if (!("state" in input)) {
    return { ok: false, code: "state_required", message: "Не передано состояние пресета." };
  }

  return {
    ok: true,
    value: { label, ...(description === undefined ? {} : { description }), state: input["state"] },
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
 * @returns {import("node:http").RequestListener}
 */
export function createHandler(store, limits = LIMITS) {
  return (req, res) => {
    const done = trace(`http ${req.method} ${req.url}`);
    handle(req, res, store, limits)
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
 */
async function handle(req, res, store, limits) {
  const method = req.method ?? "GET";
  const path = new URL(req.url ?? "/", "http://presets.local").pathname.replace(/\/+$/, "");

  if (method === "OPTIONS") return send(res, 204);

  // Проверка живости: нужна докеру и тому, кто разворачивает. Наружу она не проксируется —
  // за дверью живёт только `/api`.
  if (path === "/healthz") {
    if (method !== "GET") return methodNotAllowed(res, "GET");
    return send(res, 200, { ok: true, presets: store.size, limits });
  }

  if (path === ROOT) {
    if (method === "GET") return send(res, 200, { items: store.list() });
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

  return notFound(res);
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
