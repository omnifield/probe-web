// Стенд зоны `skin`.
//
// РАСКЛАДКА (решение user 2026-08-17): три области, каждая со СВОИМ скроллом, и ни одна не
// уезжает вместе с содержимым. Прежняя версия скроллила страницу целиком — вместе с панелью
// ручек и полосой вкладок, и пользоваться ими на длинной странице было нельзя.
//
//   ┌──────────┬──────────────────────────────┐
//   │ панель   │ вкладки (не двигаются)       │
//   │ (свой    ├──────────────────────────────┤
//   │  скролл) │ кейсы (свой скролл)          │
//   └──────────┴──────────────────────────────┘
//
// ЧТО ГДЕ ПОКАЗЫВАЕТСЯ:
//   • «Всё» — по одному базовому кейсу на семейство ПЛЮС панель настройки скина. Это витрина:
//     видно весь набор сразу и то, как он отзывается на ручки.
//   • вкладка семейства — только кейсы: базовый, отключённый, недопустимое значение, длинный
//     текст, узкая колонка. Ручек здесь нет намеренно: здесь смотрят на компонент, а не крутят
//     тему (образец — страницы компонентов Ant Design, выбран user).

import {
  Switch,
  SwitchControl,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
} from "@omnifield/probe-web-ui";
import { createSignal, For, Show } from "solid-js";

import { byGroup, GROUPS, SPECIMENS } from "./cases/index.js";
import { KnobLabel, KnobSelect } from "./knob-ui.jsx";
import { ACCENTS, createKnobs, DENSITIES, RADIUS_STEPS } from "./knobs.js";

/** Палитры зоны. Вторая — базовая пара слоя `style`, без нашей. */
const PALETTES = [
  { id: "twitter", label: "Twitter" },
  { id: "base", label: "базовая" },
] as const;

const ALL = "all";

export function App() {
  const knobs = createKnobs();
  const [tab, setTab] = createSignal<string>(ALL);

  const current = () => SPECIMENS.find((s) => s.id === tab());

  return (
    <div class="shell">
      <aside class="side">
        <div class="side__inner">
          <h1 class="side__title">
            Стенд зоны <b>skin</b>
          </h1>

          <Show
            when={tab() === ALL}
            fallback={
              <nav class="side__cases" aria-label="Кейсы">
                <span class="side__label">Кейсы</span>
                <For each={current()?.cases ?? []}>
                  {(item) => (
                    <a class="side__case" href={`#${current()?.id}-${item.id}`}>
                      {item.title}
                    </a>
                  )}
                </For>

                <span class="side__label">Зацепки</span>
                <div class="side__slots">
                  <For each={current()?.slots ?? []}>{(slot) => <code>{slot}</code>}</For>
                </div>
              </nav>
            }
          >
            <Knobs knobs={knobs} />
          </Show>
        </div>
      </aside>

      <main class="stage">
        {/* Выбор семейства — табами. Пробовал «Всё» на всю ширину плюс список семейств
            (решение user 2026-08-17), но по виду откатили: табы читаются одним взглядом, а
            список требует открыть его, чтобы узнать, что там есть. */}
        {/* Вкладки сгруппированы по смыслу (решение user 2026-08-17): тридцать семейств в один
            ряд читались как свалка. Подпись группы — не заголовок, а метка ряда: она объясняет,
            почему эти вкладки стоят рядом. */}
        <nav class="tabs" aria-label="Семейства">
          <button class="tab" type="button" aria-pressed={tab() === ALL} onClick={() => setTab(ALL)}>
            Всё
          </button>

          <For each={GROUPS}>
            {(group) => (
              <span class="tabs__group">
                <span class="tabs__group-label">{group}</span>
                <For each={byGroup(group)}>
                  {(specimen) => (
                    <button
                      class="tab"
                      type="button"
                      aria-pressed={tab() === specimen.id}
                      onClick={() => setTab(specimen.id)}
                    >
                      {specimen.title}
                    </button>
                  )}
                </For>
              </span>
            )}
          </For>
        </nav>

        <div class="scroll">
          <Show when={tab() === ALL} fallback={<CasePage />}>
            <div class="showcase">
              <For each={GROUPS}>
                {(group) => (
                  <section class="showcase__group">
                    <h2 class="showcase__title">{group}</h2>
                    <div class="grid">
                      <For each={byGroup(group)}>
                        {(specimen) => (
                          <section class="card">
                            <header class="card__head">
                              <h3>{specimen.title}</h3>
                              <button
                                class="card__more"
                                type="button"
                                onClick={() => setTab(specimen.id)}
                              >
                                кейсы →
                              </button>
                            </header>
                            <div class="card__body">{specimen.cases[0]?.render()}</div>
                          </section>
                        )}
                      </For>
                    </div>
                  </section>
                )}
              </For>
            </div>
          </Show>
        </div>
      </main>
    </div>
  );

  /** Страница семейства: только кейсы, каждый со своим заголовком и пояснением. */
  function CasePage() {
    return (
      <div class="cases">
        <For each={current()?.cases ?? []}>
          {(item) => (
            <section class="case" id={`${current()?.id}-${item.id}`}>
              <header class="case__head">
                <h2>{item.title}</h2>
                <Show when={item.note}>
                  <p class="case__note">{item.note}</p>
                </Show>
              </header>
              <div class="case__body">{item.render()}</div>
            </section>
          )}
        </For>
      </div>
    );
  }
}

/** Панель настройки скина. Живёт только на «Всё» — на странице семейства ручек нет. */
function Knobs(props: { knobs: ReturnType<typeof createKnobs> }) {
  // Читаем через функцию, а не выдёргиваем в переменную: `props` реактивны, и снятое из них
  // значение перестало бы обновляться. Правило `solid/reactivity` пресета `lint` это поймало.
  const k = () => props.knobs;

  return (
    <div class="knobs">
      {/* Два состояния — переключателем: он и показывает состояние, и меняет его одним нажатием.
          Списком такое делать незачем, а ряд из двух кнопок занимает вдвое больше места. */}
      <div class="knob">
        <KnobLabel
          text="Оформление"
          hint="Снимите — останется голый кит: примитивы без единого правила вида. Это рабочее состояние, а не поломка; заодно так видно, что панель сделана теми же компонентами."
        />
        <Switch checked={k().dressed()} onChange={() => k().toggleDressed()}>
          <SwitchInput />
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>{k().dressed() ? "подключено" : "снято"}</SwitchLabel>
        </Switch>
      </div>

      <div class="knob">
        <KnobLabel
          text="Режим"
          hint="Класс `dark` на корне документа — ровно так его поставит потребитель. Оформление про режим не знает: все значения взяты токенами, и пара меняет их сама."
        />
        <Switch checked={k().dark()} onChange={(on) => k().setDark(on)}>
          <SwitchInput />
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
          <SwitchLabel>{k().dark() ? "тёмная" : "светлая"}</SwitchLabel>
        </Switch>
      </div>

      <KnobSelect
        label="Палитра"
        hint="Три семени и форма скругления. Тёмная пара смягчена: у источника фон чистый чёрный, и это ровно то, что бьёт по глазам."
        options={PALETTES}
        value={k().palette() ? "twitter" : "base"}
        onChange={(id) => k().setPalette(id === "twitter")}
      />

      <KnobSelect
        label="Акцент"
        hint="Из одного семени база строит двенадцать ступеней и сама держит обещания контраста. Оформление при этом не меняется ни на строку."
        options={ACCENTS.map((a) => ({ id: a.id, label: a.label }))}
        value={k().accent()}
        onChange={k().setAccent}
      />

      <KnobSelect
        label="Радиус"
        hint="Меняется один токен --radius, вся шкала скруглений производная от него. Ступень «из темы» не задаёт его вовсе — значение приходит из палитры."
        options={RADIUS_STEPS.map((s) => ({ id: s.id, label: s.label }))}
        value={k().radius()}
        onChange={k().setRadius}
      />

      <KnobSelect
        label="Плотность"
        hint="Множит интервалы и высоты контролов. Кегль база плотностью не трогает: уменьшенный текст ломает 1.4.4 Resize Text, а плотность нужна ради числа строк на экране."
        options={DENSITIES.map((d) => ({ id: d.id, label: d.label }))}
        value={k().density()}
        onChange={k().setDensity}
      />

      <p class="knobs__note">
        Ручки ставят семена на корень документа — там же, где их поставит потребитель. На
        контейнере они не работают: производные и роли вычисляются там, где объявлены.
      </p>
    </div>
  );
}
