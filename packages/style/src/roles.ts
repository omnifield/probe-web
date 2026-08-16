// СЕМАНТИЧЕСКИЙ СЛОЙ: роль ссылается на ступень, а не хранит цвет. Решение — `kb:PROBEWEB-12`,
// пункт 2.
//
// ЗАЧЕМ РАЗДЕЛЕНИЕ. Пока значение и назначение — одно и то же, смена бренда переписывает все
// значения разом, а недостающее состояние приходится подменять чужой ролью: ровно так в зоне
// `skin` наведение кнопки поехало на `--accent`. Два уровня закрывают обе беды:
//
//   ШКАЛА — сырьё: `--brand-9`, у ступени есть номер и закреплённое назначение;
//   РОЛЬ  — назначение в интерфейсе: `--brand-solid: var(--brand-9)`.
//
// Проверка смысла одним вопросом: смена бренда обязана менять ШКАЛУ, не трогая РОЛИ. Поэтому
// роли живут в `base.css` (они одинаковы для всех тем и обоих режимов), а значения ступеней —
// в теме. Положи роли в тему — и каждая новая палитра переобъявляла бы их заново, то есть
// разделение существовало бы только на словах.

import type { ScaleKey } from "./scale.js";

export interface Role {
  /** Имя токена-роли (без `--`). */
  name: string;
  /** Шкала-источник. */
  scale: string;
  /** Ступень внутри шкалы. */
  step: ScaleKey;
  /** Назначение в интерфейсе — это и есть смысл роли. */
  purpose: string;
}

/**
 * РОЛИ. Перечень согласован с зоной `skin` как с единственным сегодняшним потребителем
 * (`tasker:PROBEWEB-45`): роли, которых на практике не хватает, видит тот, кто одевает кит,
 * а не тот, кто держит базу.
 *
 * Именование: роль НИКОГДА не начинается с номера ступени. `--brand-solid` говорит, для чего
 * токен, `--brand-9` — из чего он сделан; если потребитель цепляется за номер, он цепляется
 * за сырьё и ломается при первой же перенастройке шкалы.
 */
export const ROLES: readonly Role[] = [
  // Поверхности и текст — нейтральная шкала.
  { name: "surface", scale: "neutral", step: "1", purpose: "фон приложения" },
  { name: "surface-subtle", scale: "neutral", step: "2", purpose: "приглушённый фон — панели, шапки" },
  { name: "element", scale: "neutral", step: "3", purpose: "фон элемента управления" },
  { name: "element-hover", scale: "neutral", step: "4", purpose: "фон элемента при наведении" },
  { name: "element-active", scale: "neutral", step: "5", purpose: "фон элемента при нажатии" },
  { name: "separator", scale: "neutral", step: "6", purpose: "разделитель, тонкая линия" },
  { name: "border", scale: "neutral", step: "7", purpose: "граница элемента" },
  { name: "border-strong", scale: "neutral", step: "8", purpose: "сильная граница — 3:1 к фону" },
  { name: "element-solid", scale: "neutral", step: "9", purpose: "сплошной нейтральный — вторичная кнопка" },
  { name: "element-solid-hover", scale: "neutral", step: "10", purpose: "сплошной нейтральный при наведении" },
  { name: "on-element-solid", scale: "neutral", step: "contrast", purpose: "подпись на сплошном нейтральном" },
  { name: "text-muted", scale: "neutral", step: "11", purpose: "второстепенный текст — подписи, описания" },
  { name: "text", scale: "neutral", step: "12", purpose: "основной текст" },

  // Бренд.
  { name: "brand-element", scale: "brand", step: "3", purpose: "фон элемента в бренде — мягкая кнопка, метка" },
  { name: "brand-element-hover", scale: "brand", step: "4", purpose: "то же при наведении" },
  { name: "brand-element-active", scale: "brand", step: "5", purpose: "то же при нажатии" },
  { name: "brand-border", scale: "brand", step: "7", purpose: "граница брендового элемента" },
  { name: "focus-ring", scale: "brand", step: "8", purpose: "кольцо фокуса — 3:1 к фону (WCAG 2.2, 1.4.11)" },
  { name: "brand-solid", scale: "brand", step: "9", purpose: "сплошной акцент — основная кнопка" },
  { name: "brand-solid-hover", scale: "brand", step: "10", purpose: "сплошной акцент при наведении" },
  { name: "on-brand-solid", scale: "brand", step: "contrast", purpose: "подпись на сплошном акценте" },
  { name: "brand-text", scale: "brand", step: "11", purpose: "брендовый текст — ссылка" },
  { name: "brand-text-strong", scale: "brand", step: "12", purpose: "брендовый текст высокого контраста" },

  // Опасность и разрушающие действия.
  { name: "danger-element", scale: "danger", step: "3", purpose: "фон предупреждения" },
  { name: "danger-element-hover", scale: "danger", step: "4", purpose: "то же при наведении" },
  { name: "danger-border", scale: "danger", step: "7", purpose: "граница недопустимого значения" },
  { name: "danger-solid", scale: "danger", step: "9", purpose: "сплошной опасный — кнопка удаления" },
  { name: "danger-solid-hover", scale: "danger", step: "10", purpose: "то же при наведении" },
  { name: "on-danger-solid", scale: "danger", step: "contrast", purpose: "подпись на сплошном опасном" },
  { name: "danger-text", scale: "danger", step: "11", purpose: "текст ошибки" },
];

export interface LegacyAlias {
  /** Прежнее имя токена (без `--`). */
  name: string;
  /** Роль, через которую оно теперь выражено. */
  role: string;
  /** Что изменилось по смыслу — пусто, если ничего. */
  note?: string;
}

/**
 * ПРЕЖНИЙ ПЛОСКИЙ НАБОР — выражен через роли и объявлен УСТАРЕВШИМ.
 *
 * Молча выбросить его нельзя: за токены цепляется потребитель ровно так же, как `skin`
 * цепляется за `data-slot` (`kb:PROBEWEB-12`, пункт 6). Оставить как было тоже нельзя: два
 * набора имён на одно и то же — это две правды, и через выпуск никто не скажет, какая
 * каноническая.
 *
 * Поэтому: имена живут, значения приходят из ролей, и на них объявлен срок. Удаление —
 * мажорным поднятием версии, не раньше.
 */
export const LEGACY_ALIASES: readonly LegacyAlias[] = [
  { name: "background", role: "surface" },
  { name: "foreground", role: "text" },
  { name: "card", role: "surface" },
  { name: "card-foreground", role: "text" },
  { name: "popover", role: "surface" },
  { name: "popover-foreground", role: "text" },
  { name: "primary", role: "brand-solid" },
  { name: "primary-foreground", role: "on-brand-solid" },
  { name: "secondary", role: "element" },
  { name: "secondary-foreground", role: "text" },
  { name: "muted", role: "element" },
  { name: "muted-foreground", role: "text-muted" },
  {
    name: "accent",
    role: "element-hover",
    note: "прежде — второе имя приглушённого фона, которым за неимением ступени затыкали наведение; теперь это ровно ступень наведения",
  },
  { name: "accent-foreground", role: "text" },
  { name: "destructive", role: "danger-solid" },
  {
    name: "destructive-foreground",
    role: "on-danger-solid",
    note: "прежде — чистый белый на красном (4.37:1), то есть НИЖЕ порога 1.4.3; теперь подпись выбирается по контрасту, и гейт краснеет, если порог не взят",
  },
  {
    name: "input",
    role: "element",
    note: "прежде — серый, которым `skin` красил фон поля; теперь это явный фон элемента",
  },
  { name: "ring", role: "focus-ring" },
  { name: "sidebar", role: "surface-subtle", note: "семейство `--sidebar-*` — токены КОМПОНЕНТА, которого в ките нет" },
  { name: "sidebar-foreground", role: "text" },
  { name: "sidebar-primary", role: "brand-solid" },
  { name: "sidebar-primary-foreground", role: "on-brand-solid" },
  { name: "sidebar-accent", role: "element-hover" },
  { name: "sidebar-accent-foreground", role: "text" },
  { name: "sidebar-border", role: "separator" },
  { name: "sidebar-ring", role: "focus-ring" },
];

/** Имена ролей — для контракта и доки. */
export const ROLE_TOKENS: readonly string[] = ROLES.map((role) => role.name);

/** Имена устаревших токенов — для контракта и доки. */
export const LEGACY_TOKENS: readonly string[] = LEGACY_ALIASES.map((alias) => alias.name);

/** Генерация CSS-блока ролей для `base.css`. */
export function rolesCss(): string {
  const lines = ROLES.map(
    (role) => `  --${role.name}: var(--${role.scale}-${role.step}); /* ${role.purpose} */`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
}

/** Генерация CSS-блока устаревших псевдонимов для `base.css`. */
export function legacyCss(): string {
  const lines = LEGACY_ALIASES.map((alias) => {
    const note = alias.note ? ` /* ${alias.note} */` : "";
    return `  --${alias.name}: var(--${alias.role});${note}`;
  });
  return `:root {\n${lines.join("\n")}\n}`;
}
