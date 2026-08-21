// РАЗБОР ЦВЕТА — вход в гейт контраста. `PWEB-42`.
//
// ## Зачем это отдельный модуль
//
// Разбор кормит формулу, объявленную гейтом (`src/color/contrast.ts`), и ошибка здесь становится
// ошибкой ответа про читаемость. Предмет свой: не математика OKLCH (она в `oklch.ts`), а перевод
// ТЕКСТА, который написал человек, в цвет. Пока разбор жил внутри математики, он выглядел её
// деталью — и оттого расширять его было страшно.
//
// ## Почему записей стало больше
//
// Заявка зоны механики скина: разбор понимал ровно `oklch(L C H)` и шестнадцатеричную запись, и
// скин, написанный чем угодно ещё, целиком уходил в «посчитать нечем». Ответ честный, но
// бесполезный: скин может быть нечитаемым, и никто не узнает.
//
// Расширять разбор у СЕБЯ заявитель не стал, и правильно: формула и пороги объявлены гейтом этой
// зоны сознательно — чтобы «проверено» у нас и у того, кто ставит свой бренд, означало одно и то
// же. Вторая копия разбора разошлась бы с первой молча.
//
// ## Состав выбран по тому, что человек пишет на самом деле
//
// Полнота всех существующих записей не требовалась — требовалось, чтобы «нечем» перестало быть
// обычным ответом. Взято ровно то, чем цвет пишут руками и чем его отдают чужие палитры:
//
//   • ШЕСТНАДЦАТЕРИЧНАЯ, все четыре длины (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`). Две коротких
//     были, две с прозрачностью — нет, а восьмизначную выдаёт всякий редактор графики;
//   • `rgb()` и `rgba()`, обе формы записи — с запятыми и через пробел. Это то, что человек
//     набирает чаще всего, и это уже лежало в наших же эталонных скинах (`rgba(0, 0, 0, 0.06)`
//     в тени) — то есть отвергалось собственное содержимое;
//   • `hsl()` и `hsla()`, обе формы. На них стоят целые чужие наборы значений: tailwind до
//     четвёртой версии и всё, что выросло из shadcn, отдают токены именно так;
//   • `hwb()` — та же цилиндрическая семья, что и `hsl`, и стоит десяти строк поверх неё;
//   • `oklab()` — сосед нашей же записи. Математика уже есть, перевод точный и без потерь:
//     отказывать в нём значило бы отказывать в том, что мы и так умеем;
//   • ИМЕНОВАННЫЕ ЦВЕТА, все 148 (`src/color/named.ts`). Человек пишет `white` и `black`, а
//     таблица нормирована и закрыта.
//
// ## Чего разбор НЕ понимает — и это названо, а не забыто
//
//   • `lab()` и `lch()` — CIE Lab с белой точкой D50: это ВТОРОЕ цветовое пространство со своим
//     переходом и своей хроматической адаптацией. Руками их почти не пишут, а цена — ещё одна
//     матрица, точность которой пришлось бы отдельно доказывать. Понадобятся — заведём задачей;
//   • `color(display-p3 …)` и прочие охваты — то же самое, по матрице на охват;
//   • `color-mix()`, `light-dark()`, относительная запись `rgb(from …)` — это не значения, а
//     ВЫЧИСЛЕНИЯ, и зависят они от контекста. Разобрать их здесь значило бы завести второй
//     каскад; их место — там, где значения складываются, а не там, где читаются.
//
// ## Прозрачность отвергается — но теперь НАЗЫВАЕТСЯ отдельно
//
// Правило прежнее и остаётся: полупрозрачное значение делает контраст зависимым от того, что под
// ним, то есть обещание перестаёт быть проверяемым. Изменилось другое — раньше `rgba(0,0,0,.5)`
// был неотличим от мусора, потому что не разбирался ВООБЩЕ. Теперь он разбирается и отвергается,
// и причина у отказа своя (`translucent`), а не «это не цвет». Разница не косметическая: потребитель
// показывает человеку, что чинить, и «допиши, что под этим» — не то же самое, что «здесь опечатка».
//
// Полностью непрозрачное значение (`/ 1`, `ff`, `100%`) проходит: прозрачность в нём объявлена и
// ничего не отнимает.

import { NAMED_COLORS } from "./named.js";
import { type Oklch, srgbToOklch } from "./oklch.js";

/**
 * Почему запись не стала цветом.
 *
 *  • `unknown-notation` — разбор такой записи не знает: опечатка, чужое пространство, вычисление;
 *  • `translucent` — запись разобрана, но цвет полупрозрачен, и контраст на нём не считается.
 *
 * Две причины, а не одна, потому что чинятся они разным. Слепи их в «не цвет» — и человек пойдёт
 * искать опечатку там, где надо назвать заливку под текстом.
 */
export type ColorRefusal = "unknown-notation" | "translucent";

/** Ответ разбора: цвет либо НАЗВАННЫЙ отказ. Молчания среди ответов нет. */
export type ParsedColor =
  | { readonly ok: true; readonly color: Oklch }
  | { readonly ok: false; readonly refusal: ColorRefusal; readonly means: string };

/** Единица угла → множитель до градусов (CSS Values 4, §7.1). */
const ANGLE: Readonly<Record<string, number>> = {
  "": 1,
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360,
};

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value));

/**
 * Число компоненты. `none` — ноль (CSS Color 4, §4.4: отсутствующая компонента считается нулём).
 *
 * @param raw текст компоненты
 * @param scale чему равны 100 % для этой компоненты
 * @param bare чему равна единица голого числа; по умолчанию — само число
 */
function number(raw: string, scale: number, bare = 1): number | undefined {
  const text = raw.trim().toLowerCase();
  if (text === "none") return 0;

  const percent = text.endsWith("%");
  const value = Number.parseFloat(percent ? text.slice(0, -1) : text);
  if (!Number.isFinite(value)) return undefined;

  return percent ? (value / 100) * scale : value * bare;
}

/** Угол в градусах, приведённый к 0…360. Единица необязательна — голое число это градусы. */
function angle(raw: string): number | undefined {
  const text = raw.trim().toLowerCase();
  if (text === "none") return 0;

  const match = /^(-?[\d.]+(?:e[-+]?\d+)?)(deg|grad|rad|turn)?$/.exec(text);
  if (!match) return undefined;

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return undefined;

  return (((value * ANGLE[match[2] ?? ""]) % 360) + 360) % 360;
}

/**
 * Разбирает содержимое цветовой функции на компоненты и прозрачность.
 *
 * Норма допускает ДВЕ формы записи, и обе живы: старую с запятыми (`rgb(1, 2, 3)`) и новую через
 * пробел с прозрачностью после косой черты (`rgb(1 2 3 / 50%)`). Смешивать их нельзя, но
 * различать по одному признаку можно: запятая на верхнем уровне есть — форма старая.
 *
 * @returns компоненты и прозрачность текстом, либо `undefined`, если форма не та
 */
function split(inside: string, expected: number): { parts: string[]; alpha?: string } | undefined {
  const legacy = inside.includes(",");

  if (legacy) {
    const parts = inside.split(",").map((piece) => piece.trim());
    if (parts.length === expected) return { parts };
    if (parts.length === expected + 1) return { parts: parts.slice(0, expected), alpha: parts[expected] };
    return undefined;
  }

  const [head, ...rest] = inside.split("/");
  if (rest.length > 1) return undefined;

  const parts = head.trim().split(/\s+/).filter(Boolean);
  if (parts.length !== expected) return undefined;

  const alpha = rest.length === 1 ? rest[0].trim() : undefined;
  return alpha === undefined ? { parts } : { parts, alpha };
}

/** Цвет в sRGB (компоненты 0…1) плюс прозрачность — общий промежуток для всех записей. */
interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** `hsl` → sRGB. Алгоритм нормы дословно (CSS Color 4, §7.1). */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const channel = (n: number): number => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: channel(0), g: channel(8), b: channel(4) };
}

/**
 * `hwb` → sRGB. Алгоритм нормы дословно (CSS Color 4, §7.3): чистый тон, затем подмешивание
 * белизны и черноты. Сумма от единицы и выше даёт серый — иначе доли перестали бы быть долями.
 */
function hwbToRgb(h: number, w: number, b: number): { r: number; g: number; b: number } {
  if (w + b >= 1) {
    const grey = w / (w + b);
    return { r: grey, g: grey, b: grey };
  }

  const pure = hslToRgb(h, 1, 0.5);
  const mix = (value: number): number => value * (1 - w - b) + w;
  return { r: mix(pure.r), g: mix(pure.g), b: mix(pure.b) };
}

/** Шестнадцатеричная запись всех четырёх длин. */
function fromHex(raw: string): Rgba | undefined {
  const match = /^#([0-9a-f]{3,8})$/i.exec(raw);
  if (!match) return undefined;

  const digits = match[1];
  if (![3, 4, 6, 8].includes(digits.length)) return undefined;

  const short = digits.length <= 4;
  const pairs = short ? [...digits].map((digit) => digit + digit) : (digits.match(/../g) as string[]);
  const [r, g, b, a = "ff"] = pairs;
  const value = (pair: string): number => Number.parseInt(pair, 16) / 255;

  return { r: value(r), g: value(g), b: value(b), a: value(a) };
}

/** Прозрачность из текста: число 0…1 либо проценты. Не названа — единица. */
function alphaOf(raw: string | undefined): number | undefined {
  if (raw === undefined) return 1;
  const value = number(raw, 1);
  return value === undefined ? undefined : clamp(value, 0, 1);
}

/** Цветовая функция: имя, содержимое и сколько компонент до прозрачности. */
const FUNCTIONS: Readonly<Record<string, number>> = {
  rgb: 3,
  rgba: 3,
  hsl: 3,
  hsla: 3,
  hwb: 3,
  oklab: 3,
  oklch: 3,
};

/** Разбирает функциональную запись в sRGB. `oklch` и `oklab` уходят мимо sRGB — см. `parse`. */
function fromFunction(name: string, parts: string[], alpha: number): Rgba | undefined {
  if (name === "rgb" || name === "rgba") {
    const channels = parts.map((piece) => number(piece, 255));
    if (channels.some((value) => value === undefined)) return undefined;
    const [r, g, b] = channels as number[];
    return { r: clamp(r / 255, 0, 1), g: clamp(g / 255, 0, 1), b: clamp(b / 255, 0, 1), a: alpha };
  }

  const hue = angle(parts[0]);
  if (hue === undefined) return undefined;

  // Голое число у долей — это проценты без знака (норма разрешает `<number>` наравне с
  // `<percentage>`), поэтому единица голого числа здесь сотая, а не единица.
  const first = number(parts[1], 1, 0.01);
  const second = number(parts[2], 1, 0.01);
  if (first === undefined || second === undefined) return undefined;

  const rgb =
    name === "hwb"
      ? hwbToRgb(hue, clamp(first, 0, 1), clamp(second, 0, 1))
      : hslToRgb(hue, clamp(first, 0, 1), clamp(second, 0, 1));

  return { r: clamp(rgb.r, 0, 1), g: clamp(rgb.g, 0, 1), b: clamp(rgb.b, 0, 1), a: alpha };
}

/** Отказ с человеческим текстом рядом. */
function refuse(refusal: ColorRefusal, means: string): ParsedColor {
  return { ok: false, refusal, means };
}

/**
 * Разбор цвета — НЕ бросающий, с названной причиной отказа.
 *
 * ```ts
 * tryParseColor("#334455");            // { ok: true,  color: {…} }
 * tryParseColor("hsl(210 40% 25%)");   // { ok: true,  color: {…} }
 * tryParseColor("rgb(0 0 0 / 50%)");   // { ok: false, refusal: "translucent" }
 * tryParseColor("color-mix(…)");       // { ok: false, refusal: "unknown-notation" }
 * ```
 *
 * Отказ — такой же ответ, как цвет, и он ОБЯЗАН доезжать до человека: молчание здесь неотличимо
 * от «всё хорошо». Бросающий `parseColor` построен на этой же функции и добавляет к ней только
 * исключение — для входов, где отказ означает поломку сборки, а не заметку в перечне.
 *
 * @param value текст значения
 */
export function tryParseColor(value: string): ParsedColor {
  const raw = value.trim();
  const lower = raw.toLowerCase();

  // `transparent` — именованный цвет нормы с прозрачностью ноль. В таблице его нет намеренно
  // (иначе проехал бы за чёрный), но и «запись неизвестна» про него сказать нельзя: запись как
  // раз известна, отказ у неё другой. Проверено замером — браузер отдаёт `rgba(0, 0, 0, 0)`.
  if (lower === "transparent") {
    return refuse(
      "translucent",
      "цвет «transparent» полностью прозрачен: что под ним — значение не говорит, " +
        "и контраст на нём не считается",
    );
  }

  const named = NAMED_COLORS[lower];
  const hex = fromHex(named ?? raw);

  if (hex) {
    return hex.a < 1
      ? refuse(
          "translucent",
          `цвет «${value}» полупрозрачен (прозрачность ${hex.a}): контраст на нём зависит от того, ` +
            "что под ним, — назовите непрозрачное значение",
        )
      : { ok: true, color: srgbToOklch(hex) };
  }

  const call = /^([a-z]+)\(([\s\S]*)\)$/.exec(lower);
  if (!call) {
    return refuse(
      "unknown-notation",
      `цвет «${value}» не разобран: ожидается oklch/oklab/rgb/hsl/hwb, ` +
        "шестнадцатеричная запись или именованный цвет CSS",
    );
  }

  const [, name, inside] = call;
  const arity = FUNCTIONS[name];
  if (arity === undefined) {
    return refuse(
      "unknown-notation",
      `запись «${name}()» разбору неизвестна: ${
        name === "lab" || name === "lch" || name === "color"
          ? "другое цветовое пространство, здесь не поддержано"
          : "вычисляемые записи (color-mix, light-dark, относительная форма) разбором не считаются"
      }`,
    );
  }

  const pieces = split(inside, arity);
  if (!pieces) {
    return refuse("unknown-notation", `в «${value}» не ${arity} компоненты — запись не разобрана`);
  }

  const alpha = alphaOf(pieces.alpha);
  if (alpha === undefined) {
    return refuse("unknown-notation", `прозрачность в «${value}» не прочитана`);
  }
  if (alpha < 1) {
    return refuse(
      "translucent",
      `цвет «${value}» полупрозрачен (прозрачность ${alpha}): контраст на нём зависит от того, ` +
        "что под ним, — назовите непрозрачное значение",
    );
  }

  // OKLCH и OKLab минуют sRGB: перевода нет вовсе, есть смена координат. Гонять их через sRGB
  // значило бы добавить туда-обратно охват и потерять всё, что в него не влезло.
  if (name === "oklch" || name === "oklab") {
    const l = number(pieces.parts[0], 1);
    if (l === undefined) return refuse("unknown-notation", `светлота в «${value}» не прочитана`);

    if (name === "oklch") {
      const c = number(pieces.parts[1], 0.4);
      const h = angle(pieces.parts[2]);
      if (c === undefined || h === undefined) {
        return refuse("unknown-notation", `цветность или тон в «${value}» не прочитаны`);
      }
      return { ok: true, color: { l, c, h } };
    }

    const a = number(pieces.parts[1], 0.4);
    const b = number(pieces.parts[2], 0.4);
    if (a === undefined || b === undefined) {
      return refuse("unknown-notation", `оси a/b в «${value}» не прочитаны`);
    }
    // Прямоугольные координаты Oklab → полярные OkLCh. Тон у ахроматичного не определён: ноль,
    // как и в `linearToOklch`, чтобы одинаковые серые не отличались текстом.
    const c = Math.hypot(a, b);
    return { ok: true, color: { l, c, h: c < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 } };
  }

  const rgb = fromFunction(name, pieces.parts, alpha);
  if (!rgb) return refuse("unknown-notation", `компоненты в «${value}» не прочитаны`);

  return { ok: true, color: srgbToOklch(rgb) };
}

/**
 * Разбор цвета-семени. Бросает, если разобрать нечем.
 *
 * Бросающая форма нужна там, где отказ означает поломку: семя шкалы, из которого считается вся
 * лестница. Продолжать с таким семенем нельзя — незачем возвращать значение, которое каждый
 * вызывающий обязан проверить и никто не проверит.
 *
 * Там, где отказ это ЗАПИСЬ в перечне, а не поломка, — `tryParseColor`.
 *
 * @param value текст значения
 * @throws TypeError с причиной и человеческим текстом
 */
export function parseColor(value: string): Oklch {
  const parsed = tryParseColor(value);
  if (parsed.ok) return parsed.color;
  throw new TypeError(parsed.means);
}
