// ПРОБА: что видит ЧЕЛОВЕК, когда службы нет.
//
// Проба службы (`presets-api.test.ts`) проверяет провод: что уезжает, что читается, чем отличается
// отказ от отсутствия. Здесь проверяется следующий шаг — во что это превращается на экране.
//
// ПОЧЕМУ ЭТО ОТДЕЛЬНАЯ ПРОБА, а не придирка. Провод может быть безупречен, а сказанное человеку —
// ложью: ровно так и было. Панель обещала «перечень встроенный», хотя запасного перечня в зоне нет
// с тех пор, как пресеты уехали в службу (`b140858`). Человек видел пустой список и обещание
// списка, а подсказка «вернуть семя» была закрыта условием «служба отвечает» и в этом случае не
// показывалась вовсе. Ни одна проба этого не поймала, потому что `createKnobs` не был покрыт ни
// одной: провод проверяли, состояние — нет.
//
// Транспорт подменяется целиком, в сеть не ходим.

import { createRoot } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import { TWITTER } from "../src/presets/built-in.js";
import type { Preset } from "../src/presets/model.js";
import { PresetRefused, type PresetsApi, ServiceDown } from "../src/playground/presets-api.js";
import { createKnobs } from "../src/playground/knobs.js";

const ADDRESS = "http://127.0.0.1:8787";

/** Службы нет: обрыв связи или пятисотка. Именно это состояние и проверяется. */
function deadApi(): PresetsApi {
  const down = () => Promise.reject(new ServiceDown(`служба не отвечает по адресу ${ADDRESS}`));
  return { list: down, save: down, remove: down };
}

/** Служба отвечает и отдаёт перечень. */
function liveApi(items: Preset[]): PresetsApi {
  return {
    list: () => Promise.resolve(items),
    save: (preset) => Promise.resolve({ ...preset, recordId: "srv-1", origin: "свой" as const }),
    remove: () => Promise.resolve(),
  };
}

/** Пресет, пришедший из службы: у записи свой идентификатор, у темы — своё имя. */
const FROM_SERVICE: Preset = { ...TWITTER, recordId: "srv-1", origin: "свой" };

/**
 * Поднять ручки и дождаться первого ответа службы.
 *
 * Перечень читается асинхронно прямо в `createKnobs`, поэтому проба ждёт СОСТОЯНИЯ, а не считает
 * такты: счёт тактов ломается от любой лишней ступени в цепочке промисов.
 */
async function knobsOf(api: PresetsApi) {
  const { knobs, dispose } = createRoot((dispose) => ({ knobs: createKnobs(api), dispose }));
  await vi.waitFor(() => expect(knobs.busy()).toBe(false));
  return { knobs, dispose };
}

describe("службы нет — стенд жив, и человеку сказана правда", () => {
  it("перечень пуст, вид не подключён, причина названа с адресом", async () => {
    const { knobs, dispose } = await knobsOf(deadApi());

    try {
      expect(knobs.source(), "запасного склада нет — состояние обязано это называть").toBe(
        "нет связи",
      );
      expect(knobs.presets(), "перечень взять неоткуда").toEqual([]);
      expect(knobs.preset(), "нет пресета — нет скина, это рабочее состояние").toBeUndefined();

      // Адрес — единственная часть причины, по которой человек может что-то сделать: служба не
      // поднята или названа неверно. Текст ошибки движка ему не говорит ничего.
      expect(knobs.trouble(), "причина без адреса не говорит, куда смотреть").toContain(ADDRESS);
    } finally {
      dispose();
    }
  });

  it("стенд НЕ сломан: оформление подключено, ручки живы", async () => {
    // Главное обещание границы: мёртвая служба не ломает стенд. Компоненты остаются на
    // умолчаниях базы — оформление необязательно (`kb:SKIN-7`, инвариант 4).
    const { knobs, dispose } = await knobsOf(deadApi());

    try {
      expect(knobs.dressed(), "скин снялся вместе со службой").toBe(true);
      expect(knobs.dirty(), "нечего сохранять — плашка «изменён» висеть не должна").toBe(false);
      expect(() => knobs.setDensity("compact")).not.toThrow();
    } finally {
      dispose();
    }
  });

  it("сохранять некуда, и это видно по состоянию, а не по упавшему запросу", async () => {
    // Панель гасит кнопки по `source()`. Если состояние соврёт «служба», человек нажмёт
    // «Сохранить», получит ошибку и решит, что дело в пресете.
    const { knobs, dispose } = await knobsOf(deadApi());
    try {
      expect(knobs.source()).not.toBe("служба");
    } finally {
      dispose();
    }
  });
});

describe("служба отвечает", () => {
  it("перечень пришёл — пресет подключён и назван", async () => {
    const { knobs, dispose } = await knobsOf(liveApi([FROM_SERVICE]));

    try {
      expect(knobs.source()).toBe("служба");
      expect(knobs.presets()).toHaveLength(1);
      expect(knobs.preset()?.id).toBe(TWITTER.id);
      expect(knobs.trouble(), "причины нет — служба ответила").toBeNull();
    } finally {
      dispose();
    }
  });

  it("ответила пустым — это НЕ «нет связи», и человеку это разные вещи", async () => {
    // Разные состояния посылают человека в разные места: пустая служба лечится семенем
    // (`seed:presets`), мёртвая — подъёмом службы. Свести их в одно значит отправить искать не там.
    const { knobs, dispose } = await knobsOf(liveApi([]));

    try {
      expect(knobs.source()).toBe("служба");
      expect(knobs.presets()).toEqual([]);
      expect(knobs.trouble()).toBeNull();
    } finally {
      dispose();
    }
  });

  it("отказ по делу не выдаётся за отсутствие службы", async () => {
    // Спутать их — показать «служба не отвечает», когда служба как раз ответила и отказала:
    // человек пойдёт поднимать поднятую службу вместо того, чтобы прочитать отказ.
    const api: PresetsApi = {
      ...liveApi([FROM_SERVICE]),
      save: () => Promise.reject(new PresetRefused("Запись больше 64 КиБ.")),
    };
    const { knobs, dispose } = await knobsOf(api);

    try {
      await knobs.save("Мой пульт");
      expect(knobs.refusal(), "отказ службы обязан дойти до человека дословно").toContain("64 КиБ");
      expect(knobs.source(), "отказ — не потеря связи").toBe("служба");
    } finally {
      dispose();
    }
  });
});

describe("панель не обещает того, чего нет", () => {
  it("ни один текст не обещает запасной перечень", async () => {
    // Регрессия ровно этой пробы: «перечень встроенный» при пустом списке. Слово ловится в
    // ТЕКСТАХ панели, а не в коде: `origin: "встроенный"` — законная пометка семени в списке, а
    // вот обещание встроенного ПЕРЕЧНЯ незаконно, потому что перечня нет.
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { stripComments, ZONE } = await import("./css.js");

    // Комментарии снимаются: в них эта фраза стоит законно — там записано, что именно было
    // неверно и почему. Проба про то, что панель ПОКАЗЫВАЕТ, а не про то, что в ней объяснено.
    const panel = stripComments(
      readFileSync(join(ZONE, "src", "playground", "knobs-panel.tsx"), "utf8"),
    );

    expect(panel, "панель снова обещает перечень, которого нет").not.toMatch(
      /перечень\s+встроенн/i,
    );
  });
});
