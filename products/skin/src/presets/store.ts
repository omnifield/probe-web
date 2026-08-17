// ХРАНИЛИЩЕ СВОИХ ПРЕСЕТОВ.
//
// Живёт в браузере: пресет, сделанный ручками, сохраняется у того, кто его сделал, и появляется в
// списке наравне со встроенными.
//
// ПОЧЕМУ НЕ СЛУЖБА. Пресет — это данные вида, а не общий ресурс: он нужен автору, пока тот его
// придумывает, и уезжает в приложение файлом. Заводить под черновики серверное хранилище значило
// бы строить обвязку вперёд спроса; понадобится общий доступ — это отдельное решение и отдельная
// зона (`presets` уже существует и умеет хранить непрозрачный JSON).
//
// ФОРМА ХРАНЕНИЯ — тот же объект пресета, что и у встроенных. Никакой второй схемы: чем меньше
// различий между «своим» и «встроенным», тем меньше мест, где они разойдутся.

import type { Preset } from "./model.js";

const KEY = "probe-web-skin-presets";

/** Свои пресеты из хранилища. Пусто и при поломке разбора: чужой мусор нам не нужен. */
export function loadOwn(): Preset[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Проверяем форму каждого: испорченная запись не должна ронять весь список.
    return parsed.filter((item): item is Preset => {
      if (typeof item !== "object" || item === null) return false;
      const p = item as Partial<Preset>;
      return (
        typeof p.id === "string" &&
        typeof p.title === "string" &&
        typeof p.density === "string" &&
        typeof p.seeds === "object" &&
        p.seeds !== null
      );
    });
  } catch {
    return [];
  }
}

/** Сохраняет пресет: с тем же именем — заменяет, иначе добавляет. */
export function saveOwn(preset: Preset): Preset[] {
  const own = loadOwn().filter((item) => item.id !== preset.id);
  const next = [...own, { ...preset, origin: "свой" as const }];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/** Удаляет свой пресет. Встроенные не трогаются — их тут и нет. */
export function removeOwn(id: string): Preset[] {
  const next = loadOwn().filter((item) => item.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/**
 * Латиница для кириллических названий.
 *
 * Идентификатор уезжает В ИМЯ ФАЙЛА и в атрибут: «Янтарный пульт» как `data-theme` работает, а
 * как имя файла в чужой сборке — уже вопрос удачи. Поэтому имя пресета человеческое, а
 * идентификатор латинский.
 */
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/** Свободный идентификатор для нового пресета, произведённый от названия. */
export function idFor(title: string, taken: readonly string[]): string {
  const latin = [...title.toLowerCase()]
    .map((char) => CYRILLIC[char] ?? char)
    .join("");

  const base =
    latin
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "my-preset";

  if (!taken.includes(base)) return base;

  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
  return `${base}-${taken.length}`;
}
