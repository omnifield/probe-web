// ТОНКАЯ НАСТРОЙКА — правка по адресам, для тех, кому нужен CSS.
//
// Третья ступень панели и самая глубокая: человек называет свойство сам и сам выбирает координату
// (часть · вариация · состояние). Большинству это не нужно, поэтому раздел свёрнут, — но без него
// редактор был бы потолком: всё, чего не выразили ручки, выражается здесь.
//
// ## Долг одевания стоит рядом с частями
//
// Число у части — что паспорт объявил, а форма ещё не адресует (`skinGaps`). Это не украшение:
// одевающий приходит сюда доделывать, и перечень «чего не хватает» — его список работ.
//
// ## Правка едет через надевание, а не через стиль на узле
//
// Показ одет ЧЕРНОВИКОМ (`DRAFT_NAME`): правка собирается в вид механикой и надевается, как
// надевается сохранённый наряд. Разбор — в `skins/draft.ts`.

import type { Form, SkinGap } from "@omnifield/probe-web-skin/model";
import { VOCABULARY } from "@omnifield/probe-web-skin/model";
import { For, Show, createMemo, createSignal } from "solid-js";

import { partsOf, statesOfPart } from "../showcase/cases.js";
import { inherited, styleAt, withProp, type Spot } from "./spot.js";

/** Значение для выбора «база» — вариации с пустым именем не бывает, столкнуться не с чем. */
const BASE = "";

/** Значение для выбора «обычное» — состояния с пустым именем тоже не бывает. */
const PLAIN = "";

/**
 * Имена ролей для подсказки ввода.
 *
 * Перечень СЛОВАРНЫЙ, а не наш: скин отвергает роль вне словаря (`outside-vocabulary`), и
 * предлагать человеку то, что механика потом отвергнет, значит звать его писать вслепую.
 */
const ROLES: readonly string[] = VOCABULARY.map((role) => `var(--${role.name})`);

/**
 * Долг по части: что объявлено паспортом, но ни одним правилом не адресовано.
 *
 * Дыры бывают и на весь компонент («не одет вовсе») — их здесь нет намеренно: они не про часть, и
 * приписать их первой попавшейся значило бы соврать, где именно работа.
 */
function debtOf(gaps: readonly SkinGap[], component: string, part: string): SkinGap[] {
  return gaps.filter(
    (дыра) => дыра.component === component && "part" in дыра && дыра.part === part,
  );
}

/** Одна строка свойства: имя, значение и снятие. */
function PropRow(props: {
  name: string;
  value: string;
  from?: string;
  onValue: (value: string) => void;
  onDrop: () => void;
}) {
  return (
    <div class="prop" classList={{ "prop--inherited": props.from !== undefined }}>
      <label class="prop__label">
        <span class="prop__name">{props.name}</span>
        <input
          class="prop__value"
          list="роли"
          value={props.value}
          placeholder={props.from}
          onChange={(event) => props.onValue(event.currentTarget.value)}
        />
      </label>

      <Show
        when={props.from === undefined}
        fallback={<span class="prop__note">от базы</span>}
      >
        <button type="button" class="prop__drop" onClick={() => props.onDrop()}>
          снять
        </button>
      </Show>
    </div>
  );
}

/**
 * Экран правки формы.
 *
 * Черновик приходит СНАРУЖИ и наружу же отдаётся правкой: держать его здесь значило бы завести
 * вторую правду о том, что сейчас правится, — а первая уже есть у источника вида, который этим
 * черновиком одевает показ.
 */
export function Fine(props: {
  component: string;
  draft: Form | null;
  gaps: readonly SkinGap[];
  onDraft: (form: Form) => void;
}) {
  // ВЫБОР ХРАНИТСЯ ВМЕСТЕ С КОМПОНЕНТОМ, а не рядом с ним. Части и состояния у каждого свои, и
  // выбор, переживший смену компонента, указывал бы на часть, которой у нового нет: экран
  // показывал бы пустоту, а человек читал бы её как «здесь ничего не одето».
  const [chosen, setChosen] = createSignal<(Spot & { component: string }) | null>(null);
  const [adding, setAdding] = createSignal("");

  const spot = (): Spot => {
    const выбор = chosen();

    return выбор && выбор.component === props.component
      ? { part: выбор.part, variant: выбор.variant, state: выбор.state }
      : { part: partsOf(props.component)[0] ?? "", variant: null, state: null };
  };

  const part = () => spot().part;
  const variant = () => spot().variant;
  const state = () => spot().state;

  /** Двигает координату, оставляя прочие оси на месте. */
  const choose = (patch: Partial<Spot>): void => {
    setChosen({ component: props.component, ...spot(), ...patch });
  };
  const recipe = () => props.draft?.recipe ?? {};
  const variants = () => Object.keys(recipe().variants ?? {});

  /** Написанное на координате. */
  const own = createMemo(() => Object.entries(styleAt(recipe(), spot())));

  /** Приходящее на координату от базы и от вариации — показывается бледным, а не пустым. */
  const from = createMemo(() => Object.entries(inherited(recipe(), spot())));

  const правка = (name: string, value: string | undefined): void => {
    const form = props.draft;
    if (!form) return;

    props.onDraft({ ...form, recipe: withProp(form.recipe, spot(), name, value) });
  };

  return (
    <article class="form">
      <datalist id="роли">
        <For each={ROLES}>{(role) => <option value={role} />}</For>
      </datalist>

      <Show
        when={props.draft !== null}
        fallback={
          <p class="page__empty">
            Править нечем: наряд не надет. Форма пишется поверх палитры — наденьте наряд справа
            вверху, и правка начнётся с того, что в нём уже есть.
          </p>
        }
      >
        <>
            <aside class="form__parts">
              <h2 class="form__title">части</h2>

              <For each={partsOf(props.component)}>
                {(имя) => {
                  const долг = () => debtOf(props.gaps, props.component, имя);

                  return (
                    <button
                      type="button"
                      class="form__part"
                      aria-pressed={part() === имя}
                      // Смена части сбрасывает состояние: словарь состояний у каждой части свой.
                      onClick={() => choose({ part: имя, state: null })}
                    >
                      <span class="form__part-name">{имя}</span>
                      <Show when={долг().length > 0}>
                        <span class="form__debt" title={долг().map((д) => д.means).join("\n")}>
                          {долг().length}
                        </span>
                      </Show>
                    </button>
                  );
                }}
              </For>

              <p class="form__hint">
                Число рядом с частью — её долг одевания: состояния, объявленные паспортом, которых
                форма пока не адресует.
              </p>
            </aside>

            <section class="form__coords">
                <label class="axes__field">
                  <span class="axes__label">вариация</span>
                  <select
                    class="axes__select"
                    value={variant() ?? BASE}
                    onChange={(event) =>
                      choose({
                        variant: event.currentTarget.value === BASE ? null : event.currentTarget.value,
                      })
                    }
                  >
                    <option value={BASE}>база</option>
                    <For each={variants()}>{(имя) => <option value={имя}>{имя}</option>}</For>
                  </select>
                </label>

                <label class="axes__field">
                  <span class="axes__label">состояние</span>
                  <select
                    class="axes__select"
                    value={state() ?? PLAIN}
                    onChange={(event) =>
                      choose({
                        state: event.currentTarget.value === PLAIN ? null : event.currentTarget.value,
                      })
                    }
                  >
                    <option value={PLAIN}>обычное</option>
                    <For each={statesOfPart(props.component, part())}>
                      {(состояние) => <option value={состояние.name}>{состояние.name}</option>}
                    </For>
                  </select>
                </label>
            </section>

            <aside class="form__props">
              <h2 class="form__title">
                {part()} · {variant() ?? "база"} · {state() ?? "обычное"}
              </h2>

              <For each={own()}>
                {([имя, значение]) => (
                  <PropRow
                    name={имя}
                    value={String(значение)}
                    onValue={(next) => правка(имя, next)}
                    onDrop={() => правка(имя, undefined)}
                  />
                )}
              </For>

              <For each={from()}>
                {([имя, значение]) => (
                  <PropRow
                    name={имя}
                    value=""
                    from={String(значение)}
                    onValue={(next) => правка(имя, next)}
                    onDrop={() => undefined}
                  />
                )}
              </For>

              <form
                class="form__add"
                onSubmit={(event) => {
                  event.preventDefault();
                  const имя = adding().trim();
                  if (имя === "") return;
                  правка(имя, "");
                  setAdding("");
                }}
              >
                <input
                  class="prop__value"
                  placeholder="свойство: borderRadius"
                  value={adding()}
                  onInput={(event) => setAdding(event.currentTarget.value)}
                />
                <button type="submit" class="form__button">
                  добавить
                </button>
              </form>

            </aside>
        </>
      </Show>
    </article>
  );
}
