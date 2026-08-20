// СКИН «graphite» — первый скин кнопки, написанный человеком (`PWEB-31`).
//
// ## Почему его пишет человек, а не редактор
//
// Канон говорит прямо: первый скин пишет человек, редактор вкуса не создаёт — он даёт форму и
// проверяет рамки. Без готового скина редактор нечем проверить: единственным скином оказался бы
// тот, что собран в нём же, и первая ошибка ФОРМЫ стала бы неотличима от ошибки редактора.
//
// ## Скин стоит на СВОИХ переменных
//
// Ни одного имени из нашего набора значений здесь нет, и это не случайность, а проверка:
// оформление, написанное без единого нашего инструмента и без наших значений, обязано быть
// законным и проходить все проверки (страница «Устройство», `PWEB-3`). Пока первый же скин
// продукта стоял бы на нашем наборе, «инструменты необязательны» оставалось бы словом.
//
// Литералы живут ТОЛЬКО в переменных, правила ссылаются на них через `var()`. Действующая
// граница проходит не по форме значения, а по его поведению: значение вправе быть литералом, но
// обязано следовать за режимом — поэтому у каждого цвета есть тёмная пара.
//
// ## Имена вариаций — намерения, а не вид
//
// «главная», «второстепенная», «опасная» — про то, ЗАЧЕМ кнопка стоит на экране. Имена вроде
// «контурная» или «серая» вариациями не являются: это уже решение о виде, и живёт оно внутри
// скина как разновидность намерения. Имена придумал человек, и принадлежат они скину — паспорт
// их не знает и знать не должен.
//
// ## Чего здесь нет
//
// Селекторов. Ни одного: адрес правила — координаты (часть, состояние, вариация), селектор
// порождает механика из анатомии. Если чего-то нельзя выразить адресом — это заявка к
// архитектору, а не повод написать селектор руками.

import type { Skin } from "@omnifield/probe-web-skin/model";

/**
 * Скин «graphite»: сдержанный графит, одна ось намерений, обе пары режима.
 *
 * Имя латиницей — оно уезжает на корень значением `data-skin` и служит именем записи в
 * хранилище; форму имени держит хранилище, здесь оно просто ей соответствует.
 */
export const GRAPHITE: Skin = {
  name: "graphite",

  variables: {
    // Светлая половина. Она же единственная, если тёмной не объявлено, — но она объявлена:
    // пара для тёмного режима это ответственность скина, а не набора значений.
    light: {
      "skin-ink": "#16181d",
      "skin-ink-quiet": "#5b606e",
      "skin-surface": "#ffffff",
      "skin-surface-tint": "#f1f2f6",
      "skin-line": "#d5d8e0",
      "skin-brand": "#23262f",
      "skin-brand-strong": "#0f1116",
      "skin-on-brand": "#ffffff",
      "skin-danger": "#b4232d",
      "skin-danger-strong": "#8d1a22",
      "skin-on-danger": "#ffffff",
      "skin-focus": "#4361ee",
      "skin-radius": "0.5rem",
      "skin-gap": "0.5rem",
      "skin-pad-block": "0.5rem",
      "skin-pad-inline": "0.9rem",
      "skin-size": "0.95rem",
      "skin-height": "2.25rem",
      "skin-motion": "120ms",
    },
    dark: {
      "skin-ink": "#eceef4",
      "skin-ink-quiet": "#9aa0b0",
      "skin-surface": "#16181d",
      "skin-surface-tint": "#22252d",
      "skin-line": "#343845",
      "skin-brand": "#e7e9f0",
      "skin-brand-strong": "#ffffff",
      "skin-on-brand": "#15171c",
      "skin-danger": "#e5646c",
      "skin-danger-strong": "#f2868c",
      "skin-on-danger": "#1a0d0f",
      "skin-focus": "#8ea2ff",
    },
  },

  recipes: {
    button: {
      // База — вид, действующий всегда: раскладка, размеры, движение и всё, что не зависит от
      // намерения. Намерение красит, база — держит форму.
      base: {
        root: {
          props: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--skin-gap)",
            minBlockSize: "var(--skin-height)",
            paddingBlock: "var(--skin-pad-block)",
            paddingInline: "var(--skin-pad-inline)",
            borderRadius: "var(--skin-radius)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "transparent",
            fontFamily: "inherit",
            fontSize: "var(--skin-size)",
            fontWeight: 500,
            lineHeight: 1.2,
            cursor: "pointer",
            userSelect: "none",
            transition:
              "background-color var(--skin-motion), border-color var(--skin-motion), color var(--skin-motion)",
          },
          states: {
            // Обвод нужен пришедшему с клавиатуры; при нажатии мышью он лишний — потому и
            // `focus-visible`, а не `focus`. Имя приходит из паспорта, не выдумано здесь.
            "focus-visible": {
              props: {
                outline: "2px solid var(--skin-focus)",
                outlineOffset: "2px",
              },
            },
            active: {
              props: { transform: "translateY(1px)" },
            },
            // Отключённость и занятость не красят по-своему: они гасят. Разный вид у них был бы
            // ложью — занятая кнопка это отключённая кнопка, которая ещё и работает.
            disabled: {
              props: { opacity: 0.55, cursor: "not-allowed" },
            },
            busy: {
              props: { cursor: "progress" },
            },
          },
        },
      },

      variants: {
        главная: {
          root: {
            props: {
              background: "var(--skin-brand)",
              color: "var(--skin-on-brand)",
            },
            states: {
              hover: { props: { background: "var(--skin-brand-strong)" } },
            },
          },
        },
        второстепенная: {
          root: {
            props: {
              background: "var(--skin-surface)",
              color: "var(--skin-ink)",
              borderColor: "var(--skin-line)",
            },
            states: {
              hover: { props: { background: "var(--skin-surface-tint)" } },
            },
          },
        },
        опасная: {
          root: {
            props: {
              background: "var(--skin-danger)",
              color: "var(--skin-on-danger)",
            },
            states: {
              hover: { props: { background: "var(--skin-danger-strong)" } },
            },
          },
        },
      },

      // Умолчание обязательно, раз вариации объявлены: иначе «главная» и «атрибута нет» стали бы
      // двумя разными адресами, совпадающими по договорённости, которой нет ни в одном файле.
      defaultVariant: "главная",

      compoundVariants: [
        // Нажатый переключатель и раскрытый триггер — состояния, приходящие от ВНЕШНЕГО
        // компонента при композиции. Вид даёт кнопка, поведение — тот, чьё оно; одеть их надо,
        // иначе составной узел останется без вида ровно в тот момент, когда он что-то говорит.
        //
        // Пустой перечень вариаций значит «на любой, включая отсутствие имени»: подсветка
        // нажатости про состояние, а не про намерение.
        {
          states: ["pressed"],
          style: {
            root: { props: { background: "var(--skin-brand-strong)", color: "var(--skin-on-brand)" } },
          },
        },
        {
          states: ["expanded"],
          style: {
            root: { props: { borderColor: "var(--skin-focus)" } },
          },
        },
        // Отключённая кнопка не должна реагировать на наведение: браузер `:hover` на ней всё
        // равно ставит, и без этого правила опасная отключённая темнела бы под указателем,
        // обещая нажатие, которого не будет.
        {
          states: ["disabled", "hover"],
          style: {
            root: { props: { background: "var(--skin-brand)" } },
          },
        },
      ],
    },
  },
};
