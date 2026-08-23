// ЭКРАН ПРАВКИ — показ того, что правишь, и настройки рядом.
//
// ## Витрина и правка — разные экраны
//
// На витрине СМОТРЯТ: меняют скин, сверяют половины, листают компоненты; настроек там нет ни
// одной. Здесь ПРАВЯТ, и показ другой — не весь поток вариаций, а та координата, над которой
// идёт работа (решение user 2026-08-23).
//
// Разница не в оформлении, а в предмете. Витринный поток отвечает на «как выглядит компонент
// целиком», правка — на «что я сейчас меняю». Смешай их, и оба вопроса останутся без ответа:
// среди двух десятков карточек не видно, какую из них ты только что тронул.
//
// ## Координата живёт ЗДЕСЬ, а не в тонкой настройке
//
// Часть, вариация и состояние выбираются на самом экране, потому что от них зависит показ. Стой
// они внутри свёрнутого раздела «Тонко», человек крутил бы цвета, не понимая, что именно видит, —
// и не смог бы посмотреть наведение, не открыв раздел, который ему не нужен.

import { RenderTree } from "@omnifield/probe-web-assembly";
import type { SkinGap } from "@omnifield/probe-web-skin/model";
import { For, Show, createSignal } from "solid-js";

import type { Draft } from "../skins/index.js";
import { axisCases, partsOf, statesOfPart } from "../showcase/cases.js";
import { REGISTRY } from "../showcase/registry.js";

import { Fine } from "./fine.jsx";
import { Panel } from "./panel.jsx";
import type { Spot } from "./spot.js";

/** Выбор «база» и «обычное» — пустым значением: ни вариации, ни состояния с пустым именем нет. */
const NONE = "";

/**
 * Экран правки: слева показ выбранной координаты, справа настройки.
 *
 * Черновик приходит СНАРУЖИ и наружу же отдаётся: вторая правда о том, что сейчас правится,
 * развела бы показ и запись — а показ здесь одет именно черновиком.
 */
export function EditScreen(props: {
  component: string;
  draft: Draft | null;
  gaps: readonly SkinGap[];
  saving: boolean;
  trouble: unknown;
  onDraft: (draft: Draft) => void;
  onSavePalette: (name: string) => void;
  onSaveSkin: (name: string) => void;
}) {
  // Выбор хранится ВМЕСТЕ с компонентом: части и состояния у каждого свои, и выбор, переживший
  // смену компонента, указывал бы на часть, которой у нового нет.
  const [chosen, setChosen] = createSignal<(Spot & { component: string }) | null>(null);

  const spot = (): Spot => {
    const выбор = chosen();

    return выбор && выбор.component === props.component
      ? { part: выбор.part, variant: выбор.variant, state: выбор.state }
      : { part: partsOf(props.component)[0] ?? "", variant: null, state: null };
  };

  const choose = (patch: Partial<Spot>): void => {
    setChosen({ component: props.component, ...spot(), ...patch });
  };

  const variants = () => Object.keys(props.draft?.form?.recipe.variants ?? {});

  /**
   * Случай для показа — порождённый теми же осями, что на витрине.
   *
   * Вариация берётся конкретная: «база» в разметке означает «атрибута нет», а значит действует
   * умолчание скина, и показывать под этим выбором надо именно его.
   */
  const shown = () =>
    axisCases(props.component, {
      part: spot().part,
      variant:
        spot().variant ?? props.draft?.form?.recipe.defaultVariant ?? variants()[0] ?? "",
      state: spot().state,
      variants: variants(),
    })[0];

  return (
    <div class="work work--editing">
      <section class="stage">
        <div class="stage__coords">
          <label class="axes__field">
            <span class="axes__label">часть</span>
            <select
              class="axes__select"
              value={spot().part}
              onChange={(event) => choose({ part: event.currentTarget.value, state: null })}
            >
              <For each={partsOf(props.component)}>
                {(имя) => <option value={имя}>{имя}</option>}
              </For>
            </select>
          </label>

          <label class="axes__field">
            <span class="axes__label">вариация</span>
            <select
              class="axes__select"
              value={spot().variant ?? NONE}
              onChange={(event) =>
                choose({
                  variant: event.currentTarget.value === NONE ? null : event.currentTarget.value,
                })
              }
            >
              <option value={NONE}>база</option>
              <For each={variants()}>{(имя) => <option value={имя}>{имя}</option>}</For>
            </select>
          </label>

          <label class="axes__field">
            <span class="axes__label">состояние</span>
            <select
              class="axes__select"
              value={spot().state ?? NONE}
              onChange={(event) =>
                choose({
                  state: event.currentTarget.value === NONE ? null : event.currentTarget.value,
                })
              }
            >
              <option value={NONE}>обычное</option>
              <For each={statesOfPart(props.component, spot().part)}>
                {(состояние) => <option value={состояние.name}>{состояние.name}</option>}
              </For>
            </select>
          </label>
        </div>

        <Show
          when={shown()}
          fallback={
            <p class="page__empty">
              Показать нечего: скин не надет, а без него вариаций не существует.
            </p>
          }
        >
          {(случай) => (
            <div class="stage__show">
              <RenderTree tree={случай().tree} registry={REGISTRY} />
            </div>
          )}
        </Show>

        <p class="stage__note">
          Показан ЧЕРНОВИК: правка собрана механикой и надета, тем же путём, что сохранённый скин.
        </p>
      </section>

      <Panel
        palette={props.draft?.palette ?? null}
        form={props.draft?.form ?? null}
        gaps={props.gaps}
        saving={props.saving}
        trouble={props.trouble}
        onPalette={(цвета) => props.onDraft({ ...props.draft, palette: цвета })}
        onSavePalette={props.onSavePalette}
        onSaveSkin={props.onSaveSkin}
        fine={
          <Fine
            component={props.component}
            draft={props.draft?.form ?? null}
            gaps={props.gaps}
            spot={spot()}
            onSpot={choose}
            onDraft={(форма) => props.onDraft({ ...props.draft, form: форма })}
          />
        }
      />
    </div>
  );
}
