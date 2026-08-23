// Девпанель: вкладки зон и выбор оформления.
//
// СОБРАНА НА НАТИВНЫХ ЭЛЕМЕНТАХ, и это временно (решение user 2026-08-20). Прежде панель
// стояла на ките и одевалась прежним поколением оформления; поколение снято целиком, а новый
// скин ещё не написан. Панель — рабочий инструмент, и ждать она не может.
//
// Что из этого следует, чтобы возврат на кит был дешёвым:
//   • ЛОГИКА НЕ ЗАВИСИТ ОТ РАЗМЕТКИ. Опрос зон, применение выбора, наблюдение за кадром — всё
//     работает поверх сигналов и не знает, чем нарисовано. Возврат трогает только разметку;
//   • ДОСТУПНОСТЬ НЕ ИМИТИРУЕТСЯ. Там, где нативный элемент её даёт сам (`select`, `button`),
//     берётся он. Там, где не даёт (вкладки), роли расставлены руками и помечены как долг —
//     подделывать клавиатурный обход вкладок здесь не станем, это работа кита;
//   • СВОЙ ВИД ЗНАЕТ, ЧТО ОН ВРЕМЕННЫЙ. Панель задаёт его сама, литералами — см. `panel.css`.
//
// ЗОНЫ ПОКАЗЫВАЮТСЯ ТОЛЬКО ПОДНЯТЫЕ (решение user): вкладка, которую нельзя открыть, — это шум.
// Поднявшаяся зона появляется сама в течение нескольких секунд.
//
// ОДЕВАЕТСЯ ПАНЕЛЬ ШТАТНЫМ НАДЕВАНИЕМ, и другого пути нет. Прежде здесь жил пресетный путь
// (`applySkin`, `restoreSkin`, `readSkin`, атрибут `data-theme`) — вторая механика того же
// потока, снятая целиком (`PWEB-72`). Панель была её последним потребителем.

import {
  makeSkinSwitch,
  type SkinMode,
  type SkinSwitch,
  type SkinWorn,
} from "@omnifield/probe-web-runtime";
import { generateSkinCss, type Skin } from "@omnifield/probe-web-skin";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";

interface Zone {
  id: string;
  label: string;
  port: number;
  up: boolean;
}

interface PresetItem {
  id: string;
  label: string;
}

// ВЫБОР ДЕРЖИТ РАНТАЙМ, а не панель. Своего хранилища здесь больше нет: запоминание выбора —
// часть механики, и второй ключ рядом означал бы два места, где живёт ответ на вопрос «чем
// страница одета». Панель — первый живой потребитель этой механики.

/**
 * Источник скинов панели: перечень и текст приходят из службы хранилища.
 *
 * Служба хранит СКИН — переменные и рецепты одной записью, — а не готовый файл. Порождает из
 * него CSS та же механика, которой пользуется приложение человека: своего пути сборки у панели
 * быть не должно, иначе она показывала бы не то, что увидит человек.
 */
const SOURCE = {
  names: async (): Promise<readonly string[]> => {
    const said = (await (await fetch("/__nav/presets")).json()) as { presets: PresetItem[] };
    return said.presets.map((item) => item.id);
  },
  css: async (name: string): Promise<string> => {
    const record = (await (await fetch(`/__nav/preset/${encodeURIComponent(name)}`)).json()) as {
      state?: Skin;
    };
    // Отказ источника не глотаем: надевание обязано узнать, что текста нет, — иначе на корне
    // останется опознание скина, которого не приехало.
    if (!record.state) throw new Error(`[dev-nav] в записи «${name}» нет скина`);
    return generateSkinCss(record.state, passportOf);
  },
};

export function Panel() {
  const [zones, setZones] = createSignal<Zone[]>([]);
  const [current, setCurrent] = createSignal<string>("");
  const [presets, setPresets] = createSignal<PresetItem[]>([]);
  // Стартовое состояние — ГОЛОЕ, и названо им честно: скина нет, половины нет. Ни то, ни другое
  // не придумывается: не выбрано — значит нечего.
  const [worn, setWorn] = createSignal<SkinWorn | null>(null);
  const [nonce, setNonce] = createSignal(0);

  const skins: SkinSwitch = makeSkinSwitch(SOURCE);
  onCleanup(() => skins.dispose());

  let frame: HTMLIFrameElement | undefined;

  const live = createMemo(() => zones().filter((zone) => zone.up));

  /**
   * Надеть скин на СВОЮ страницу штатным надеванием.
   *
   * Половина едет вместе со скином, а не отдельной ручкой: она часть скина, и вторая ручка была
   * бы вторым ответом на вопрос «во что одета страница».
   *
   * Отказ источника не роняет панель: она рабочий инструмент, и недоступная служба пресетов —
   * не повод терять вкладки зон. На корне при этом остаётся то, что было.
   */
  async function dress(name: string | null, mode?: SkinMode) {
    try {
      setWorn(name === null ? (skins.takeOff(), null) : await skins.wear(name, { mode }));
    } catch {
      /* службы нет или запись негодна — панель остаётся как была */
    }
  }

  // ЗОНУ В КАДРЕ ПАНЕЛЬ БОЛЬШЕ НЕ ОДЕВАЕТ, и это не потеря, а снятая подпорка.
  //
  // Прежде она дотягивалась до соседнего документа руками — ставила туда атрибут пресета и
  // класс режима. Атрибута больше нет: пресетный путь снят целиком, а надевание работает со
  // СВОИМ документом и в чужой не лезет по устройству.
  //
  // Возвращать это своим способом нельзя: чужой документ, одетый мимо механики, — ровно та
  // вторая дорога, ради снятия которой всё и делалось. Зона одевается сама, тем же надеванием,
  // и панель показывает её такой, какая она есть. Понадобится примерка скина внутри зоны —
  // это отдельный предмет и отдельный разговор, а не атрибут сбоку.

  async function refreshZones() {
    try {
      const said = (await (await fetch("/__nav/status")).json()) as {
        current: string;
        zones: Zone[];
      };
      // Сравниваем по составу, а не по ссылке: свежий массив каждые четыре секунды заставлял
      // бы вкладки перерисовываться целиком, дёргая фокус и выделение.
      const before = zones()
        .map((zone) => `${zone.id}:${zone.up ? 1 : 0}`)
        .join();
      const after = said.zones.map((zone) => `${zone.id}:${zone.up ? 1 : 0}`).join();
      if (before !== after) setZones(said.zones);
      // Держим открытой поднятую зону: если текущая упала, переходим на первую живую.
      const alive = said.zones.filter((zone) => zone.up);
      const stillUp = alive.some((zone) => zone.id === said.current);
      const wanted = stillUp ? said.current : (alive[0]?.id ?? "");
      if (wanted && wanted !== current()) await open(wanted);
      else setCurrent(wanted);
    } catch {
      /* панель переживает недоступность своего же сервера молча — следующий опрос повторит */
    }
  }

  async function refreshPresets() {
    try {
      const said = (await (await fetch("/__nav/presets")).json()) as { presets: PresetItem[] };
      setPresets(said.presets);
    } catch {
      setPresets([]);
    }
  }

  async function open(id: string) {
    // Ранний выход — НЕ оптимизация, а защита от петли: смена ключа кадра ниже перезагружает
    // зону, а обработчик срабатывает и при перерисовке. Без этой строки зона перезагружается
    // бесконечно и вешает вкладку браузера.
    if (!id || id === current()) return;
    await fetch(`/__nav/switch?zone=${encodeURIComponent(id)}`, { method: "POST" });
    setCurrent(id);
    setNonce((n) => n + 1);
  }

  onMount(() => {
    // Восстановление — И СКИН, И ПОЛОВИНА, одним вызовом: человек, выбравший их в прошлый
    // заход, обязан увидеть их же. Ничего не запоминает, поэтому безопасно на каждом запуске.
    //
    // Не вспомнилось — не надевается ничего, и это рабочее состояние: панель остаётся голой,
    // как и любое приложение без скина.
    void skins.restore().then(setWorn).catch(() => undefined);
    void refreshZones();
    void refreshPresets();
    // Опрос вместо канала — сознательно: канал заводится, когда задержка начнёт мешать.
    const zonesTimer = setInterval(() => void refreshZones(), 4000);
    const presetsTimer = setInterval(() => void refreshPresets(), 10000);
    onCleanup(() => {
      clearInterval(zonesTimer);
      clearInterval(presetsTimer);
    });
  });

  return (
    <div class="panel">
      <div class="panel-bar">
        <span class="panel-brand">
          Девпанель<small>{live().length ? `${live().length} в работе` : "никого"}</small>
        </span>

        <Show when={live().length > 0}>
          {/* ДОЛГ, названный вслух: роли расставлены, но клавиатурный обход стрелками здесь
              НЕ сделан. Подделывать его разметкой не станем — это работа кита, и она вернётся
              вместе с ним. Пока вкладки доступны обходом по Tab, как обычные кнопки. */}
          <div class="panel-tabs" role="tablist" aria-label="Зоны">
            <For each={live()}>
              {(zone) => (
                <button
                  type="button"
                  class="panel-tab"
                  role="tab"
                  aria-selected={current() === zone.id}
                  title={`порт ${zone.port}`}
                  onClick={() => void open(zone.id)}
                >
                  {zone.label}
                </button>
              )}
            </For>
          </div>
        </Show>

        <div class="panel-look">
          {/* Есть сохранённые оформления — список. Нет — ничего: подпись про пустоту
              занимает место и ничего не говорит (решение user). */}
          <Show when={presets().length > 0}>
            <select
              class="panel-select"
              aria-label="Скин"
              value={worn()?.name ?? ""}
              onChange={(event) => void dress(event.currentTarget.value || null)}
            >
              {/* Голая строка — рабочий выбор, а не заглушка: без скина панель показывает
                  голый кит, и человеку нужен способ туда вернуться. */}
              <option value="">без скина</option>
              <For each={presets()}>
                {(item) => <option value={item.id}>{item.label}</option>}
              </For>
            </select>
          </Show>

          {/* Половину переключаем ТОЛЬКО когда скин надет: без скина её не существует, и
              кнопка, которая ничего не делает, врёт про возможность. */}
          <Show when={worn()}>
            {(on) => (
              <button
                type="button"
                class="panel-btn"
                title="Светлая или тёмная половина"
                onClick={() => void dress(on().name, on().mode === "dark" ? "light" : "dark")}
              >
                ◐
              </button>
            )}
          </Show>
          <button
            type="button"
            class="panel-btn panel-btn-quiet"
            title="Перезагрузить зону"
            onClick={() => setNonce((n) => n + 1)}
          >
            ↻
          </button>
        </div>
      </div>

      <div class="panel-stage">
        <Show
          when={current()}
          fallback={
            <div class="panel-empty">
              <p>Ни одна зона не поднята.</p>
              <p>
                Подними любую: <code>cd products/tables && npx vite --port 5173 --strictPort</code>
              </p>
            </div>
          }
        >
          {/* Обработчика загрузки здесь больше нет: он одевал зону в кадре руками и следил за
              её атрибутом. Оба конца этого обмена жили на снятом пресетном пути. */}
          <iframe ref={frame} src={`/?nav=${nonce()}`} title="Зона" />
        </Show>
      </div>
    </div>
  );
}
