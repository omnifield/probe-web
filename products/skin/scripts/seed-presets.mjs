// СЕМЯ СЛУЖБЫ: встроенные пресеты уезжают в общее хранилище.
//
// Запуск: `pnpm run seed:presets` (адрес — `PRESETS_URL`, умолчание — служба на этой машине).
//
// ЗАЧЕМ. Перечень пресетов человек видит из СЛУЖБЫ (решение user 2026-08-17): стенд уезжает на
// VPS, и пресет коллеги обязан быть виден остальным. Встроенные три при этом остаются в коде —
// но не как второй перечень, а как СЕМЯ: из модели рождаются и записи службы, и файлы поставки.
//
// ИДЕМПОТЕНТНО. Записи с тем же именем не задваиваются: служба выдаёт идентификаторы сама, и без
// проверки повторный прогон засыпал бы список копиями «Twitter».
//
// Служба не отвечает — это не поломка семени: скрипт говорит об этом и выходит с ненулевым
// кодом, чтобы прогон в конвейере не сделал вид, что всё уехало.

import { BUILT_IN } from "../src/presets/built-in.ts";

const BASE = process.env["PRESETS_URL"] ?? "http://127.0.0.1:8787/api/presets";
const KIND = "skin";

/** Что уезжает в конверт: МОДЕЛЬ, а не готовый CSS — из модели он всегда соберётся. */
function toWire(preset) {
  return {
    label: preset.title,
    description: `Встроенный пресет зоны skin. Подключается файлом presets/${preset.id}.css плюс атрибутом data-theme="${preset.id}".`,
    kind: KIND,
    state: {
      // Имя ТЕМЫ — то, что уедет в `data-theme` и совпадает с именем файла поставки. Служба
      // выдаёт свой идентификатор записи, но он опознаёт запись, а не тему.
      id: preset.id,
      seeds: preset.seeds,
      ...(preset.meta === undefined ? {} : { meta: preset.meta }),
      ...(preset.darkOverrides === undefined ? {} : { darkOverrides: preset.darkOverrides }),
      density: preset.density,
    },
  };
}

let existing;
try {
  const response = await fetch(`${BASE}?kind=${KIND}`);
  if (!response.ok) throw new Error(`служба ответила ${response.status}`);
  existing = (await response.json()).items ?? [];
} catch (error) {
  console.error(`служба не отвечает по адресу ${BASE}: ${error.message}`);
  console.error("подними её (`pnpm --filter @probe-web/presets start`) или назови адрес в PRESETS_URL");
  process.exit(1);
}

const known = new Set(existing.map((item) => item.label));
let added = 0;

for (const preset of BUILT_IN) {
  if (known.has(preset.title)) {
    console.info(`уже в службе: ${preset.title}`);
    continue;
  }

  const response = await fetch(BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(toWire(preset)),
  });

  if (!response.ok) {
    console.error(`служба не приняла «${preset.title}»: ${response.status} ${await response.text()}`);
    process.exit(1);
  }

  const saved = await response.json();
  console.info(`положено: ${preset.title} → ${saved.id}`);
  added += 1;
}

console.info(`семя готово: добавлено ${added}, всего в службе ${existing.length + added}`);
