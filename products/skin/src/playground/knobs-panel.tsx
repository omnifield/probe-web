// Панель настройки вида — правая колонка стенда.
//
// Живёт отдельным файлом, потому что `app.tsx` про РАСКЛАДКУ: где колонки, что схлопывается, что
// прокручивается. Смешивать раскладку с содержимым панели — верный способ получить файл, в
// котором не найти ни то, ни другое.
//
// Управление сделано НАШИМИ компонентами (подсказка, список выбора, переключатель): стенд ест
// свой корм, и криво лёгший селект в узкой колонке я увижу первым.

import {
  Switch,
  SwitchControl,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
} from "@omnifield/probe-web-ui";

import { KnobLabel, KnobSelect } from "./knob-ui.jsx";
import { ACCENTS, type createKnobs, DENSITIES, RADIUS_STEPS } from "./knobs.js";

/** Палитры зоны. Вторая — базовая пара слоя `style`, без нашей. */
const PALETTES = [
  { id: "twitter", label: "Twitter" },
  { id: "base", label: "базовая" },
] as const;

/** Панель настройки вида. */
export function Knobs(props: { knobs: ReturnType<typeof createKnobs> }) {
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
