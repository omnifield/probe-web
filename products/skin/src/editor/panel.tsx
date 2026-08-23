// ПАНЕЛЬ НАСТРОЙКИ — одно место, где человек крутит вид.
//
// ## Цвет и форма РЯДОМ
//
// Человек не крутит цвета в пустоте: он смотрит на компонент и крутит их на нём. Поэтому здесь
// нет ни отдельного экрана палитры, ни отдельного экрана формы — есть один поток настроек, и
// разделение записей внутри его не касается.
//
// ## Уровни, а не всё сразу
//
// Три ступени, и это устройство взято с рынка, где оно устоялось: готовые наборы → понятные
// ручки → правка руками. Ровно так стоит Site Editor у WordPress (вариации стиля, панель Styles,
// Additional CSS) и, короче, tweakcn (пресеты, ползунки, экспорт).
//
// Смысл ступеней не в «сложности», а в том, ЧЕМ человек думает:
//
//   • **готовое** — «хочу как вот это»;
//   • **ручки** — «хочу поокруглее и посинее»;
//   • **тонко** — «хочу `justify-content: space-between` на кнопке раздела».
//
// Первые две ступени не знают ни одного слова CSS. Третья спрятана и открывается тем, кому она
// нужна; без неё редактор был бы потолком, а с ней — полом.

import type { Form, Palette, SkinGap } from "@omnifield/probe-web-skin/model";
import { For, Show, createSignal } from "solid-js";

import { colorKnobs, sizeKnobs, withColor, withSize } from "./knobs.js";

/**
 * Один раскрывающийся раздел панели. Открытость — местная, к записи отношения не имеет.
 *
 * Начальное положение читается ОДИН раз и нарочно: раздел, который человек свернул, не вправе
 * открыться сам от того, что снаружи что-то пересчиталось.
 */
function Section(props: { title: string; means?: string; open?: boolean; children: unknown }) {
  // eslint-disable-next-line solid/reactivity -- начальное положение, а не следование за пропом
  const [open, setOpen] = createSignal(props.open ?? false);

  return (
    <section class="knobs__section" classList={{ "knobs__section--open": open() }}>
      <button
        type="button"
        class="knobs__head"
        aria-expanded={open()}
        onClick={() => setOpen(!open())}
      >
        <span class="knobs__title">{props.title}</span>
        <Show when={props.means}>
          <span class="knobs__means">{props.means}</span>
        </Show>
      </button>

      <Show when={open()}>
        <div class="knobs__body">{props.children as never}</div>
      </Show>
    </section>
  );
}

/**
 * Настройки вида: цвета, меры и — под спойлером — правка по адресам.
 *
 * Палитра и форма приходят порознь и порознь же отдаются: делить их в интерфейсе незачем, а
 * сливать в одну запись нельзя — палитру тянут несколько скинов сразу, и правка в ней видна всем,
 * кто её тянет. Это и есть причина, по которой записи две, а панель одна.
 */
export function Panel(props: {
  palette: Palette | null;
  form: Form | null;
  gaps: readonly SkinGap[];
  saving: boolean;
  trouble: unknown;
  onPalette: (palette: Palette) => void;
  onSavePalette: (name: string) => void;
  onSaveSkin: (name: string) => void;
  fine: unknown;
}) {
  const [цвета, setЦвета] = createSignal("");
  const [скин, setСкин] = createSignal("");

  return (
    <div class="knobs">
      <Show when={props.palette}>
        {(palette) => (
          <>
            <Section title="Цвета" means="намерения, из которых строятся все оттенки" open>
              <For each={colorKnobs(palette())}>
                {(ручка) => (
                  <label class="knob">
                    <span class="knob__name">{ручка.title}</span>

                    <span class="knob__field">
                      {/* Родной выбор цвета: он у человека уже привычный, а свой отнял бы
                          пипетку и недавние цвета, ничего не дав взамен. */}
                      <input
                        type="color"
                        class="knob__color"
                        value={ручка.seed}
                        onInput={(event) =>
                          props.onPalette(
                            withColor(palette(), ручка.role, event.currentTarget.value),
                          )
                        }
                      />
                      <output class="knob__value">{ручка.seed}</output>
                    </span>
                  </label>
                )}
              </For>

              <p class="knobs__note">
                Крутится СЕМЯ — из него механика строит двенадцать ступеней и обе половины.
                Отдельно тёмную не настраивают: она выводится, иначе их стало бы две разных.
              </p>
            </Section>

            <Section title="Меры" means="округлость, просторность, размеры" open>
              <For each={sizeKnobs(palette())}>
                {(ручка) => (
                  <div class="knob">
                    <span class="knob__name" title={ручка.means}>
                      {ручка.title}
                    </span>

                    <Show
                      when={ручка.bounds && ручка.amount !== null}
                      fallback={
                        <span class="knob__field">
                          <span class="knob__value knob__value--quiet">
                            {ручка.poles ?? "не задано"}
                          </span>
                        </span>
                      }
                    >
                      <span class="knob__field">
                        <input
                          type="range"
                          class="knob__range"
                          min={ручка.bounds?.min}
                          max={ручка.bounds?.max}
                          step={ручка.bounds?.step}
                          value={ручка.amount ?? 0}
                          title={ручка.bounds?.why}
                          onInput={(event) =>
                            props.onPalette(
                              withSize(
                                palette(),
                                ручка.seed,
                                Number(event.currentTarget.value),
                                ручка.unit,
                              ),
                            )
                          }
                        />
                        <output class="knob__value">
                          {ручка.amount}
                          {ручка.unit}
                        </output>
                      </span>
                    </Show>
                  </div>
                )}
              </For>

              <p class="knobs__note">
                Ползунок не пускает ниже нормы там, где норма есть: у просторности пол выведен из
                требования к размеру цели (WCAG 2.2, 2.5.8), а не выбран нами.
              </p>
            </Section>
          </>
        )}
      </Show>

      <Section title="Тонко" means="правка по адресам — для тех, кому нужен CSS">
        {props.fine as never}
      </Section>

      {/* СОХРАНЕНИЕ ДВУМЯ ИМЕНАМИ, потому что вещей действительно две и человек их различает:
          «цвета» переносятся между скинами, «скин» — это сочетание цветов с формами.

          Прежнее имя цветов — правка той записи, которую тянут другие скины: они увидят её
          сразу, ничего у себя не храня. Новое имя — новая запись, и прежние скины останутся на
          прежних цветах. */}
      <section class="knobs__save">
        <label class="knob">
          <span class="knob__name">цвета</span>
          <span class="knob__field">
            <input
              class="prop__value"
              placeholder={props.palette?.name ?? "имя-латиницей"}
              value={цвета()}
              onInput={(event) => setЦвета(event.currentTarget.value)}
            />
            <button
              type="button"
              class="form__button"
              disabled={props.saving}
              onClick={() => props.onSavePalette(цвета().trim() || (props.palette?.name ?? ""))}
            >
              сохранить
            </button>
          </span>
        </label>

        <label class="knob">
          <span class="knob__name">скин</span>
          <span class="knob__field">
            <input
              class="prop__value"
              placeholder="имя-латиницей"
              value={скин()}
              onInput={(event) => setСкин(event.currentTarget.value)}
            />
            <button
              type="button"
              class="form__button form__button--main"
              disabled={props.saving || скин().trim() === ""}
              onClick={() => props.onSaveSkin(скин().trim())}
            >
              {props.saving ? "сохраняю…" : "сохранить"}
            </button>
          </span>
        </label>

        <p class="knobs__note">
          Скин — это выбранные цвета вместе с формами компонентов. Обе половины, светлая и
          тёмная, идут в нём парой: половина принадлежит скину, отдельной темы не бывает.
        </p>

        <Show when={props.trouble}>
          <p class="form__trouble">{String(props.trouble)}</p>
        </Show>
      </section>
    </div>
  );
}
