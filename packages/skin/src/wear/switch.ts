// Надевание и снятие скина + проверка порядка подключения. Источник принимается, а не зашивается.
// Разбор — FAQ.md.

import { DEFAULT_STORAGE_KEY, recall, remember, type Remembered } from "./memory.js";
import { readDark, readToken, readWorn, writeDark, writeWorn } from "./root.js";
import { makeSkinSheet } from "./sheet.js";
import { trace } from "../trace/index.js";

/** Режим: светлая или тёмная пара. */
export type SkinMode = "light" | "dark";

/** Пара «свойство → значение», которую база обязана поставить на корень. */
export interface StyleMarker {
  property: string;
  value: string;
}

/** Что нужно проверке порядка подключения. */
export interface StyleOrderOptions {
  marker: StyleMarker;
}

export type StyleOrderStatus = "ok" | "missing-base" | "no-skin";

/** Разбор проверки порядка — значением, а не только строкой в консоли. */
export interface StyleOrderReport {
  status: StyleOrderStatus;
  marker: StyleMarker;
  /** Что на корне нашлось. Пусто — свойства нет вовсе. */
  seen: string;
  skin: string | null;
  /** Человеку. У `ok` — пусто. */
  message: string;
}

/**
 * Приехал ли на корень базовый CSS под надетым скином.
 *
 * @throws если у пары пуста любая половина
 */
export function checkStyleOrder(options: StyleOrderOptions): StyleOrderReport {
  const done = trace("checkStyleOrder");
  const { marker } = options;

  if (marker.property.trim() === "" || marker.value.trim() === "") {
    throw new Error(
      "[web-core-skin] checkStyleOrder(): маркер — ПАРА, свойство и его значение, и " +
        `здесь пуста одна из половин (свойство «${marker.property}», значение ` +
        `«${marker.value}»).`,
    );
  }

  const skin = readWorn();
  const seen = readToken(marker.property);
  const arrived = seen === marker.value.trim();
  const status: StyleOrderStatus = arrived ? "ok" : skin === null ? "no-skin" : "missing-base";

  const message =
    status === "missing-base"
      ? `[web-core-skin] порядок подключения нарушен: скин «${skin}» надет, ` +
        `а базового CSS нет — на корне ${marker.property} обязан быть «${marker.value}», ` +
        `а он ${seen === "" ? "не объявлен вовсе" : `равен «${seen}»`}. Порядок ` +
        "импортов: базовый CSS → скин."
      : "";

  if (status === "missing-base") console.error(message);

  done();
  return { status, marker, seen, skin, message };
}

/** То, что приложение сообщает механике о своих скинах. */
export interface SkinSource {
  /** Имена доступных скинов. */
  names(): readonly string[] | Promise<readonly string[]>;
  /** Текст стилей скина по имени. */
  css(name: string): string | Promise<string>;
}

/** Чем настраивается переключатель при заведении. */
export interface SkinSwitchOptions {
  /** Ключ хранилища, если приложению нужен свой. */
  storageKey?: string;
  /** Чем жить, когда запомненного нет или оно больше не годится. */
  fallback?: { skin?: string; mode?: SkinMode };
}

/** Чем настраивается одно действие. */
export interface SkinWearOptions {
  /** Половина, в которой надеть. Не названа — встаёт запомненная. */
  mode?: SkinMode;
  /** Запомнить ли выбор между заходами. По умолчанию да. */
  remember?: boolean;
}

/** Во что одета страница. */
export interface SkinWorn {
  name: string;
  mode: SkinMode;
}

/** Надевает и снимает скины одного приложения. Владеет своим листом стилей. */
export interface SkinSwitch {
  names(): Promise<readonly string[]>;
  /** Во что одета страница сейчас; `null` — голый кит. */
  worn(): SkinWorn | null;
  /**
   * @returns что надето после вызова
   * @throws отказ источника — как есть
   */
  wear(name: string, options?: SkinWearOptions): Promise<SkinWorn | null>;
  takeOff(options?: SkinWearOptions): void;
  /** Восстанавливает запомненный выбор — и скин, и половину. */
  restore(): Promise<SkinWorn | null>;
  /** Снимает свой лист стилей. Опознание на корне не трогает. */
  dispose(): void;
}

function checkedName(name: string): string {
  if (name.trim() === "") {
    throw new Error(
      "[web-core-skin] wear(): имя скина пусто. Снять скин — это takeOff().",
    );
  }
  return name;
}

/** Заводит переключатель скинов поверх источника приложения. */
export function makeSkinSwitch(source: SkinSource, options: SkinSwitchOptions = {}): SkinSwitch {
  const key = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const sheet = makeSkinSheet();

  /** Номер последнего начатого действия — против гонки с асинхронным источником. */
  let turn = 0;

  function worn(): SkinWorn | null {
    const name = readWorn();
    return name === null ? null : { name, mode: readDark() ? "dark" : "light" };
  }

  async function wear(name: string, wearOptions: SkinWearOptions = {}): Promise<SkinWorn | null> {
    const done = trace("wear");
    const checked = checkedName(name);
    const mine = ++turn;

    const css = await source.css(checked);

    if (mine !== turn) {
      done();
      return worn();
    }

    sheet.put(css);
    writeWorn(checked);

    const mode = wearOptions.mode ?? recall(key)?.mode;
    if (mode !== undefined) writeDark(mode === "dark");

    if (wearOptions.remember !== false) {
      const record: Remembered = { skin: checked };
      if (wearOptions.mode !== undefined) record.mode = wearOptions.mode;
      remember(key, record);
    }

    done();
    return worn();
  }

  function takeOff(wearOptions: SkinWearOptions = {}): void {
    const done = trace("takeOff");
    turn += 1;

    sheet.drop();
    writeWorn(null);
    writeDark(false);

    if (wearOptions.remember !== false) remember(key, { skin: null });

    done();
  }

  async function restore(): Promise<SkinWorn | null> {
    const done = trace("restore");
    const remembered = recall(key)?.skin;

    if (remembered === null) {
      done();
      return worn();
    }

    const fallback = options.fallback ?? {};
    const known = remembered !== undefined && (await source.names()).includes(remembered);
    const wanted = known ? remembered : fallback.skin;

    if (wanted === undefined) {
      done();
      return worn();
    }

    const result = await wear(wanted, { remember: false, mode: recall(key)?.mode ?? fallback.mode });
    done();
    return result;
  }

  return {
    names: async () => source.names(),
    worn,
    wear,
    takeOff,
    restore,
    dispose: sheet.drop,
  };
}
