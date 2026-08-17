// Панель настройки вида — правая колонка стенда.
//
// Живёт отдельным файлом, потому что `app.tsx` про РАСКЛАДКУ. Смешивать раскладку с содержимым
// панели — верный способ получить файл, в котором не найти ни то, ни другое.
//
// ГЛАВНОЕ В ПАНЕЛИ — ПРЕСЕТ, а не отдельные ручки. Сверху выбор пресета, под ним признак
// «изменён» с сохранением, дальше ручки, которые его меняют, и внизу выдача для приложения.
// Порядок именно такой: сначала «что подключено», потом «чем правлю», потом «как унести».
//
// Управление сделано нашими компонентами (подсказка, список выбора, переключатель, поле): стенд
// ест свой корм, и криво лёгший селект в узкой колонке я увижу первым.

import {
  Button,
  Field,
  Input,
  Label,
  Switch,
  SwitchControl,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
} from "@omnifield/probe-web-ui";
import { createSignal, Show } from "solid-js";

import { KnobLabel, KnobSelect } from "./knob-ui.jsx";
import { ACCENTS, type createKnobs, DENSITIES, RADIUS_STEPS } from "./knobs.js";

/** Панель настройки вида. */
export function Knobs(props: { knobs: ReturnType<typeof createKnobs> }) {
  // Читаем через функцию, а не выдёргиваем в переменную: `props` реактивны, и снятое из них
  // значение перестало бы обновляться. Правило `solid/reactivity` пресета `lint` это поймало.
  const k = () => props.knobs;

  const [name, setName] = createSignal("");
  const [copied, setCopied] = createSignal(false);

  const copy = () => {
    void navigator.clipboard.writeText(k().css()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div class="knobs">
      {/* ── пресет ─────────────────────────────────────────────────────────────────────── */}
      <KnobSelect
        label="Пресет"
        hint="Полный набор значений вида: семена шкал, скругление, интервалы, кегль, плотность. Подключается целиком — как костюм, а не по одной вещи. Механика компонентов от пресета не меняется."
        options={k()
          .presets()
          .map((p) => ({ id: p.id, label: p.origin === "свой" ? `${p.title} (свой)` : p.title }))}
        value={k().preset().id}
        onChange={k().usePreset}
      />

      {/* Признак «изменён» показывается ТОЛЬКО когда есть что сохранять: постоянная плашка
          перестаёт читаться как сообщение и становится частью фона. */}
      <Show when={k().dirty()}>
        <div class="knobs__dirty">
          <p class="knob__hint">
            Пресет изменён ручками. Сохраните как свой — он появится в списке наравне со
            встроенными и его можно будет подключить в приложении.
          </p>

          <Field>
            <Label>Название</Label>
            <Input
              value={name()}
              placeholder={`${k().preset().title} — правка`}
              onInput={(event) => setName(event.currentTarget.value)}
            />
          </Field>

          <div class="knobs__row">
            <Button
              data-size="sm"
              onClick={() => {
                k().save(name() || `${k().preset().title} — правка`);
                setName("");
              }}
            >
              Сохранить как свой
            </Button>
            <Button data-size="sm" data-variant="outline" onClick={() => k().reset()}>
              Вернуть
            </Button>
          </div>
        </div>
      </Show>

      <Show when={k().preset().origin === "свой" && !k().dirty()}>
        <div class="knobs__row">
          <Button data-size="sm" data-variant="danger-outline" onClick={() => k().drop()}>
            Удалить пресет
          </Button>
        </div>
      </Show>

      {/* ── ручки ──────────────────────────────────────────────────────────────────────── */}
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
          hint="Светлый и тёмный — выбор пользователя, а не свойство пресета: один пресет обязан работать в обоих. Поэтому режим в пресет не входит."
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
        label="Акцент"
        hint="Из одного семени база строит двенадцать ступеней и сама держит обещания контраста. Оформление при этом не меняется ни на строку."
        options={ACCENTS.map((a) => ({ id: a.id, label: a.label }))}
        value={k().accent()}
        onChange={k().setAccent}
      />

      <KnobSelect
        label="Радиус"
        hint="Меняется один токен --radius, вся шкала скруглений производная от него."
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

      {/* ── унести в приложение ────────────────────────────────────────────────────────── */}
      <div class="knob">
        <KnobLabel
          text="Унести в приложение"
          hint="Пресет отдаётся как CSS: подключаете файл и ставите data-theme со своим именем. Без сборки и без единой строки JS — поэтому первичен именно CSS, а не описание объектом."
        />
        {/* У ИЗМЕНЁННОГО ПРЕСЕТА КОПИРОВАНИЕ ЗАКРЫТО, и это не придирка. CSS выпускается под
            именем пресета; унеся правку встроенного «dense», потребитель получил бы блок
            `[data-theme="dense"]` с ЧУЖИМИ значениями и переписал бы встроенный вид у себя.
            Сохранение даёт правке своё имя — и путаница исчезает вместе с ним. */}
        <Show
          when={!k().dirty()}
          fallback={
            <p class="knob__hint">
              Сначала сохраните пресет: правка уедет под своим именем, а не подменит встроенный.
            </p>
          }
        >
          <div class="knobs__row">
            <Button data-size="sm" data-variant="soft" onClick={copy}>
              {copied() ? "скопировано" : "Скопировать CSS"}
            </Button>
          </div>
          <p class="knob__hint">
            <code>{`<html data-theme="${k().preset().id}">`}</code>
          </p>
        </Show>
      </div>

      <p class="knobs__note">
        Ручки ставят семена на корень документа — там же, где их поставит потребитель. На
        контейнере они не работают: производные и роли вычисляются там, где объявлены.
      </p>
    </div>
  );
}
