// Тонкая обвязка к НАСТОЯЩЕМУ браузеру: запустить, загрузить разметку, спросить документ, снять кадр.
//
// Зачем это здесь, а не в зоне. Есть вопросы, на которые отвечает только настоящий движок:
// каскадные слои, отрисовка системных элементов, `color-scheme`. jsdom слои игнорирует целиком,
// а встроенных контролов не рисует вовсе — на таком вопросе он молча отвечает «не знаю» видом
// зелёной пробы. Это не повод оставлять вопрос без ответа и не повод тащить инструмент в зону:
// раз он общий, он живёт в утвари и его заводит архитектор.
//
// ПОЧЕМУ ЧЕРЕЗ КАНАЛ, А НЕ ЧЕРЕЗ ПОРТ. Протокол умеет два транспорта: websocket на порту и сырой
// JSON в паре дескрипторов (`--remote-debugging-pipe`). Клиента websocket в дереве нет, ставить
// пакет ради этого не станем — канал не требует ни одного. Заодно нечему конфликтовать по портам
// с девсервером.
//
// ПОЧЕМУ БРАУЗЕР ВООБЩЕ ЕСТЬ. В образе лежит кеш playwright с бинарём Chromium, при том что
// самого пакета в дереве нет. Проверка `есть ли playwright в node_modules` отвечает «браузера
// нет» — и отвечает неверно; так этот пункт гейта однажды и остался незакрытым (`PWEB-55`).
// Путь к бинарю берётся из кеша и проверяется перед запуском: пропал — скажем прямо, а не упадём
// невнятно.

import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CACHE = join(process.env["HOME"] ?? "/home/node", ".cache/ms-playwright");

/** Где лежит бинарь. Версия в имени папки меняется — ищем, а не прописываем. */
export function findChrome() {
  if (!existsSync(CACHE)) return null;

  for (const entry of readdirSync(CACHE)) {
    if (!entry.startsWith("chromium-")) continue;
    const path = join(CACHE, entry, "chrome-linux64/chrome");
    if (existsSync(path)) return path;
  }

  return null;
}

/**
 * Поднять браузер, отдать вызывающему говорилку протокола, погасить в любом исходе.
 *
 * `call(метод, параметры)` — один вызов протокола в присоединённой вкладке.
 */
export async function withChrome(run) {
  const binary = findChrome();
  if (!binary) {
    throw new Error(
      `живого браузера нет: в ${CACHE} не нашлось бинаря Chromium. ` +
        `Проверять рисование нечем — не подменяй эту проверку поиском строки, назови пункт незакрытым.`,
    );
  }

  const chrome = spawn(
    binary,
    [
      "--headless=new",
      "--remote-debugging-pipe",
      "--no-sandbox",
      "--disable-gpu",
      "--force-device-scale-factor=1",
      "about:blank",
    ],
    // Шум графической подсистемы в контейнере (dbus, Vulkan, EGL) к делу не относится и
    // отрисовку не отменяет — она уходит на программный путь. Поэтому глушим, а не показываем:
    // на фоне сотни строк ERROR настоящая ошибка теряется.
    { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] },
  );

  const [, , , toChrome, fromChrome] = chrome.stdio;
  const waiting = new Map();
  let counter = 0;
  let buffer = "";

  // Сообщения в канале разделены нулевым байтом и приходят кусками произвольной длины —
  // склеиваем и режем по разделителю, а не по границе куска.
  fromChrome.on("data", (chunk) => {
    buffer += chunk.toString();
    let cut;
    while ((cut = buffer.indexOf("\0")) >= 0) {
      const message = JSON.parse(buffer.slice(0, cut));
      buffer = buffer.slice(cut + 1);
      const seat = waiting.get(message.id);
      if (!seat) continue;
      waiting.delete(message.id);
      if (message.error) seat.no(new Error(JSON.stringify(message.error)));
      else seat.ok(message.result);
    }
  });

  const send = (method, params = {}, sessionId) =>
    new Promise((ok, no) => {
      const id = ++counter;
      waiting.set(id, { ok, no });
      toChrome.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + "\0");
    });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);

  await call("Page.enable");
  await call("Runtime.enable");

  try {
    return await run(call);
  } finally {
    chrome.kill();
  }
}

/** Загрузить разметку строкой и дождаться, пока документ соберётся. */
export async function load(call, html) {
  await call("Page.navigate", {
    url: "data:text/html;charset=utf-8," + encodeURIComponent(html),
  });

  for (let tries = 0; tries < 60; tries++) {
    const said = await call("Runtime.evaluate", {
      expression: "document.readyState",
      returnByValue: true,
    });
    if (said.result.value === "complete") return;
    await new Promise((wake) => setTimeout(wake, 50));
  }

  throw new Error("документ не собрался за три секунды");
}

/** Спросить документ выражением. Исключение внутри страницы поднимаем сюда, а не глотаем. */
export async function ask(call, expression) {
  const said = await call("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (said.exceptionDetails) {
    throw new Error(
      `страница ответила исключением: ${said.exceptionDetails.exception?.description ?? said.exceptionDetails.text}`,
    );
  }

  return said.result.value;
}

/** Каким человек увидит настроенный у себя режим. Без этого замер идёт под умолчанием движка. */
export const system = (call, half) =>
  call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: half }],
  });

/** Снять кадр. Нужен там, где вопрос про ВИД, а не про вычисленное значение. */
export async function shoot(call, path) {
  const { data } = await call("Page.captureScreenshot", { format: "png" });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(path, Buffer.from(data, "base64"));
  return path;
}
