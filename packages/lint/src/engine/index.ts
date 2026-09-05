// см. README.md / FAQ.md

export type CanonSeverity = "required" | "off";

export interface CanonRule {
  /** Семантический id — общий для любого движка, который однажды реализует канон. */
  readonly id: string;
  readonly severity: CanonSeverity;
  /** Что ловит правило и почему это дефект, а не вкус — без привязки к формулировкам плагина. */
  readonly summary: string;
}

const canon = <const T extends readonly CanonRule[]>(rules: T): T => Object.freeze(rules) as T;

/**
 * Четыре несущих правила — они названы в контракте зон (`PROBEWEB-4`) и обязаны быть включены.
 * Вынесены отдельным списком, чтобы «канон» был адресуемым перечнем, а не растворялся среди
 * сопутствующих проверок.
 */
export const canonRules = canon([
  {
    id: "reactivity",
    severity: "required",
    summary:
      "Чтение реактивного (props/сигнал/мемо) вне отслеживаемой области — изменение теряется " +
      "молча. Центральное правило: остальные лишь закрывают частные случаи.",
  },
  {
    id: "no-destructure",
    severity: "required",
    summary:
      "Деструктуризация props рвёт связь с источником: реактивность держится на доступе через " +
      "свойство. Граница правила — ловится только список параметров, см. FAQ.md.",
  },
  {
    id: "no-react-deps",
    severity: "required",
    summary:
      "Массивы зависимостей у createEffect/createMemo — перенос привычки из React; в Solid " +
      "зависимости собираются сами, а массив создаёт ложное впечатление контроля.",
  },
  {
    id: "components-return-once",
    severity: "required",
    summary:
      "Ранний return в компоненте: тело компонента исполняется ОДИН раз, поэтому условие " +
      "обязано жить внутри JSX (<Show />, фрагмент), а не перед ним.",
  },
]);

/**
 * Сопутствующие правила: те же реактивность и JSX, но частными случаями. Обязательность та
 * же, что у канона — «включено» здесь не значит «менее важно».
 */
export const companionRules = canon([
  {
    id: "event-handlers",
    severity: "required",
    summary:
      "Обработчик на нативном элементе не реактивен, как прочие JSX-props: имя вида onclick " +
      "против onClick меняет способ привязки. Правило снимает двусмысленность имени.",
  },
  {
    id: "imports",
    severity: "required",
    summary:
      "Импорт из неверного входа solid-js (solid-js/web, solid-js/store) — рабочая на вид " +
      "программа с неверным поведением.",
  },
  {
    id: "jsx-no-duplicate-props",
    severity: "required",
    summary: "Повтор одного prop в JSX: побеждает последний, остальные молча теряются.",
  },
  {
    id: "jsx-no-undef",
    severity: "required",
    summary:
      "Необъявленный компонент в JSX. Проверку имён, которые уже видит компилятор TS, за " +
      "правилом оставляем то, чего он не видит — конкретика включения в плагине, не здесь.",
  },
  {
    id: "jsx-uses-vars",
    severity: "required",
    summary:
      "Не диагностика, а подпорка: помечает переменные, использованные ТОЛЬКО в JSX, как " +
      "использованные — иначе no-unused-vars режет живые компоненты.",
  },
  {
    id: "jsx-no-script-url",
    severity: "required",
    summary: "javascript:-URL в JSX — исполнение строки как кода.",
  },
  {
    id: "no-innerhtml",
    severity: "required",
    summary: "innerHTML — вставка непроверенной разметки; в Solid для этого есть явные средства.",
  },
  {
    id: "no-react-specific-props",
    severity: "required",
    summary: "className/htmlFor — React-props, помеченные устаревшими ещё в Solid v1.4.0.",
  },
  {
    id: "prefer-for",
    severity: "required",
    summary:
      ".map() в JSX вместо <For />: map пересоздаёт узлы целиком, For держит их по ссылке на " +
      "элемент. Разница не стилистическая, а в том, что происходит с DOM.",
  },
  {
    id: "style-prop",
    severity: "required",
    summary:
      "style строкой вместо объекта и kebab-case свойства — Solid ставит их через " +
      "style.setProperty, и форма записи меняет результат.",
  },
  {
    id: "self-closing-comp",
    severity: "required",
    summary:
      "Пустой элемент без самозакрытия. Единственное здесь стилистическое правило; держим " +
      "обязательным, потому что оно чинится автофиксом целиком и не требует решения человека.",
  },
]);

/**
 * Правила, выключенные ОСОЗНАННО. Список существует, чтобы «не включено» отличалось от «не
 * рассмотрено»: тест сверяет, что каждое правило плагина попало ровно в одну из трёх карт, и
 * падает, когда выпуск плагина приносит новое.
 */
export const offRules = canon([
  {
    id: "no-unknown-namespaces",
    severity: "off",
    summary:
      "Пространства имён (use:, prop:, attr:) в TS проверяет компилятор — правило дублировало " +
      "бы его и ошибалось на директивах потребителя.",
  },
  {
    id: "no-array-handlers",
    severity: "off",
    summary: "Запрет инлайновых обработчиков-массивов — рабочая форма Solid, а не дефект.",
  },
  {
    id: "prefer-show",
    severity: "off",
    summary: "Требование <Show /> вместо && : обе формы каноничны, выбор за автором.",
  },
  {
    id: "no-proxy-apis",
    severity: "off",
    summary: "Запрет proxy-API нужен только тем, кто целится в окружения без Proxy.",
  },
  {
    id: "prefer-classlist",
    severity: "off",
    summary: "classlist помечен устаревшим в самом Solid — правило зовёт в обратную сторону.",
  },
]);

/** Полная карта канона: несущие + сопутствующие + явные выключения, одним списком. */
export const rules = canon([...canonRules, ...companionRules, ...offRules]);
