// Образец СКИНА для проб — общий на все файлы проб.
//
// Живёт отдельным файлом, потому что нужен и хранилищу, и поверхности: разъедься эти два
// образца, и пробы начали бы проверять разные единицы, называя их одним словом.

/**
 * СКИН — та единица, ради которой всё это и правилось: переменные плюс рецепты, по одному
 * рецепту на компонент (`PWEB-13`). Собираем правдоподобный, а не игрушечный: форма рецепта —
 * `defineSlotRecipe`, части, база, вариации, умолчание, пересечения.
 *
 * Хранилище в это не смотрит НИ РАЗУ. Проба строит настоящую единицу не ради разбора, а ради
 * РАЗМЕРА и целости: гейт задачи говорит «кладётся и читается целиком, без потери частей», и
 * проверить это игрушкой в двести байт нельзя.
 *
 * @param {number} components сколько компонентов одевает скин
 */
export function skin(components) {
  const slots = ["root", "control", "label", "indicator", "icon"];
  /** Состояния — из словаря Zag плюс псевдоклассы браузера: ровно то, что адресует скин. */
  const states = ["_hover", "_focusVisible", "[data-disabled]", "[data-state=open]"];

  /** @param {string} slot @param {number} n */
  const rules = (slot, n) => ({
    display: slot === "root" ? "inline-flex" : "block",
    alignItems: "center",
    gap: `var(--spacing-${n % 6})`,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `var(--border-${slot})`,
    borderRadius: "var(--radius-md)",
    padding: "0.5rem 1rem",
    fontSize: "var(--text-md)",
    lineHeight: "1.4",
    letterSpacing: "0.01em",
    transition: "background 120ms ease, border-color 120ms ease",
  });

  /** @type {Record<string, unknown>} */
  const recipes = {};
  for (let i = 0; i < components; i++) {
    /** @type {Record<string, unknown>} */
    const base = {};
    for (const slot of slots) {
      /** @type {Record<string, unknown>} */
      const declared = { ...rules(slot, i) };
      for (const state of states) declared[state] = rules(slot, i + 1);
      base[slot] = declared;
    }
    recipes[`компонент-${i}`] = {
      slots,
      base,
      variants: {
        вид: {
          главная: { root: { background: "var(--brand-solid)", color: "var(--brand-on)" } },
          тихая: { root: { background: "transparent", color: "var(--text-muted)" } },
          опасная: { root: { background: "var(--danger-solid)", color: "var(--danger-on)" } },
        },
        размер: {
          малый: { control: { height: "2rem" }, label: { fontSize: "var(--text-sm)" } },
          обычный: { control: { height: "2.5rem" }, label: { fontSize: "var(--text-md)" } },
          крупный: { control: { height: "3rem" }, label: { fontSize: "var(--text-lg)" } },
        },
      },
      defaultVariants: { вид: "главная", размер: "обычный" },
      compoundVariants: [
        { вид: "тихая", размер: "малый", css: { control: { borderWidth: "0" } } },
        { вид: "опасная", размер: "крупный", css: { label: { fontWeight: "600" } } },
      ],
    };
  }
  return {
    variables: {
      палитра: { brand: "oklch(0.62 0.19 256)", surface: "oklch(0.98 0 0)" },
      скругление: { sm: "2px", md: "6px", lg: "12px" },
      плотность: 1,
      шрифты: { основной: "Inter, system-ui, sans-serif" },
    },
    recipes,
  };
}

