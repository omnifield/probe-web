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

export interface Role {
  /** Имя токена-роли (без `--`). */
  name: string;
  /** Токен-источник: ступень шкалы, на которую роль ссылается. */
  token: string;
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
  { name: "surface", token: "neutral-1", purpose: "фон приложения" },
  { name: "surface-subtle", token: "neutral-2", purpose: "приглушённый фон — панели, шапки" },
  { name: "element", token: "neutral-3", purpose: "фон элемента управления" },
  { name: "element-hover", token: "neutral-4", purpose: "фон элемента при наведении" },
  { name: "element-active", token: "neutral-5", purpose: "фон элемента при нажатии" },
  { name: "separator", token: "neutral-6", purpose: "разделитель, тонкая линия" },
  { name: "border", token: "neutral-7", purpose: "граница элемента" },
  { name: "border-strong", token: "neutral-8", purpose: "сильная граница — 3:1 к фону" },
  { name: "element-solid", token: "neutral-9", purpose: "сплошной нейтральный — вторичная кнопка" },
  { name: "element-solid-hover", token: "neutral-10", purpose: "сплошной нейтральный при наведении" },
  { name: "on-element-solid", token: "neutral-contrast", purpose: "подпись на сплошном нейтральном" },
  { name: "text-muted", token: "neutral-11", purpose: "второстепенный текст — подписи, описания" },
  { name: "text", token: "neutral-12", purpose: "основной текст" },

  // Бренд.
  { name: "brand-element", token: "brand-3", purpose: "фон элемента в бренде — мягкая кнопка, метка" },
  { name: "brand-element-hover", token: "brand-4", purpose: "то же при наведении" },
  { name: "brand-element-active", token: "brand-5", purpose: "то же при нажатии" },
  { name: "brand-border", token: "brand-7", purpose: "граница брендового элемента" },
  { name: "focus-ring", token: "brand-8", purpose: "кольцо фокуса — 3:1 к фону (WCAG 2.2, 1.4.11)" },
  { name: "brand-solid", token: "brand-9", purpose: "сплошной акцент — основная кнопка" },
  { name: "brand-solid-hover", token: "brand-10", purpose: "сплошной акцент при наведении" },
  { name: "on-brand-solid", token: "brand-contrast", purpose: "подпись на сплошном акценте" },
  { name: "brand-text", token: "brand-11", purpose: "брендовый текст — ссылка" },
  { name: "brand-text-strong", token: "brand-12", purpose: "брендовый текст высокого контраста" },

  // Опасность и разрушающие действия.
  { name: "danger-element", token: "danger-3", purpose: "фон предупреждения" },
  { name: "danger-element-hover", token: "danger-4", purpose: "то же при наведении" },
  { name: "danger-border", token: "danger-7", purpose: "граница недопустимого значения" },
  { name: "danger-solid", token: "danger-9", purpose: "сплошной опасный — кнопка удаления" },
  { name: "danger-solid-hover", token: "danger-10", purpose: "то же при наведении" },
  { name: "on-danger-solid", token: "danger-contrast", purpose: "подпись на сплошном опасном" },
  { name: "danger-text", token: "danger-11", purpose: "текст ошибки" },

  // Просвечивающие роли: работают поверх ПРОИЗВОЛЬНОГО фона, а не поверх известного. Именно
  // поэтому они альфа-ступени, а не сплошные: сплошная закрыла бы то, что под ней.
  {
    name: "overlay",
    token: "scrim",
    purpose: "затемнение под модальным слоем — лежит НИЖЕ слоя, на уровне `--z-overlay`",
  },
  {
    name: "tint-hover",
    token: "neutral-a3",
    purpose: "подсветка при наведении поверх произвольного фона — строки таблицы, пункта списка",
  },
  {
    name: "tint-active",
    token: "neutral-a5",
    purpose: "то же при нажатии и для выбранного пункта",
  },
  {
    name: "brand-tint",
    token: "brand-a4",
    purpose: "брендовая подсветка поверх произвольного фона — выделенная строка",
  },
  {
    name: "danger-tint",
    token: "danger-a4",
    purpose: "подсветка ошибки поверх произвольного фона — строка с недопустимым значением",
  },
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
    (role) => `  --${role.name}: var(--${role.token}); /* ${role.purpose} */`,
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
