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
//   • СВОЙ ВИД ЗНАЕТ, ЧТО ОН ВРЕМЕННЫЙ. Значения берутся ролями слоя, а не литералами: когда
//     приедет скин, панель сменит разметку, а не палитру.
//
// ЗОНЫ ПОКАЗЫВАЮТСЯ ТОЛЬКО ПОДНЯТЫЕ (решение user): вкладка, которую нельзя открыть, — это шум.
// Поднявшаяся зона появляется сама в течение нескольких секунд.

import { applySkin, readSkin, restoreSkin, type SkinChoice } from "@omnifield/probe-web-runtime";
import { themeModelToCss, type ThemeModel } from "@omnifield/probe-web-style";
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

export function Panel() {
  const [zones, setZones] = createSignal<Zone[]>([]);
  const [current, setCurrent] = createSignal<string>("");
  const [presets, setPresets] = createSignal<PresetItem[]>([]);
  // Стартовое состояние — ГОЛОЕ, и названо им честно: пресета нет, режим светлый не по выбору
  // человека, а потому что на голом документе класса режима не существует.
  const [look, setLook] = createSignal<SkinChoice>({ preset: null, mode: "light", dressed: false });
  const [nonce, setNonce] = createSignal(0);

  let frame: HTMLIFrameElement | undefined;

  const live = createMemo(() => zones().filter((zone) => zone.up));

  /**
   * Собрать стили выбранного пресета ИЗ СЛУЖБЫ.
   *
   * Служба хранит МОДЕЛЬ, а не готовый файл: бэк хранит, зона понимает. Собирает из неё вид
   * генератор БАЗЫ, и своего пути сборки у панели быть не должно.
   */
  async function applyPresetCss(id: string | null) {
    const tag = document.getElementById("preset-css");
    // Палитры по умолчанию больше нет: надеваемый набор снят с поставки. Не назвали пресет —
    // собирать нечего, страница остаётся голой, и это её рабочее состояние.
    if (!id) {
      tag?.remove();
      return;
    }
    try {
      const record = (await (await fetch(`/__nav/preset/${encodeURIComponent(id)}`)).json()) as {
        state?: ThemeModel;
      };
      const model = record.state;
      if (!model) return;
      const css = themeModelToCss(model);
      const style = (tag as HTMLStyleElement | null) ?? document.createElement("style");
      style.id = "preset-css";
      style.textContent = css;
      if (!tag) document.head.append(style);
    } catch {
      /* службы нет — панель остаётся на умолчаниях базы, оформление необязательно */
    }
  }

  function apply(next: SkinChoice, remember = true) {
    // Идемпотентность: `apply` зовётся и на загрузку кадра, поэтому запись сигнала без
    // изменений — лишний повод для перерисовки. Дешевле сравнить, чем ловить последствия.
    const same = next.preset === look().preset && next.mode === look().mode;
    if (!same) setLook(next);

    // СВОЯ страница — штатной механикой рантайма, а не своим атрибутом: второй способ надеть
    // скин означал бы второе место, где живёт это знание.
    applySkin({ preset: next.preset, mode: next.mode, remember });
    void applyPresetCss(next.preset);

    const inner = frame?.contentDocument?.documentElement;
    if (!inner) return;
    // Кадр — ЧУЖОЙ документ, и механика до него не дотягивается: она работает с `document`
    // своей страницы. Здесь атрибут ставится руками не как второй путь применения, а как
    // единственный способ дотянуться до соседнего документа.
    //
    // Своё берёт верх над общим: зону, поставившую собственный выбор, панель не перебивает.
    if (inner.dataset["lookOwn"] === "true") return;
    if (next.preset) inner.dataset["theme"] = next.preset;
    inner.classList.toggle("dark", next.mode === "dark");
  }

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
      // Перечень приехал — теперь запомненный выбор можно восстановить целиком: до этого
      // момента сохранённый пресет не проходил проверку «есть ли он в перечне» и отбрасывался.
      // `restoreSkin()` ничего не запоминает, поэтому повтор безопасен.
      // Умолчания по пресету нет и не подставляется: не выбрано — значит голо. Режим тоже не
      // навязываем — он половина скина, и на голой странице его не существует.
      const back = restoreSkin({ presets: said.presets.map((item) => item.id) });
      if (back.preset !== look().preset || back.mode !== look().mode) apply(back, false);
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

  /**
   * Смотреть, что зона делает со своей темой.
   *
   * Обмен идёт через атрибут на корне: панель ставит его зоне, зона читает. Обратного канала
   * не было — поэтому смена пресета внутри зоны до панели не доходила. Наблюдение закрывает
   * это тем же способом, каким зона слушает нас, и работает потому, что origin общий.
   */
  function watchZone() {
    const root = frame?.contentDocument?.documentElement;
    if (!root) return;
    const watcher = new MutationObserver(() => {
      const theirs = root.dataset["theme"];
      if (theirs && theirs !== look().preset) apply({ ...look(), preset: theirs });
    });
    watcher.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    onCleanup(() => watcher.disconnect());
  }

  onMount(() => {
    // Палитру назвала точка входа — до первой отрисовки, иначе вспышка. Здесь только читаем,
    // что встало: восстановление с ПОЛНЫМ перечнем сделает `refreshPresets()`, когда список
    // сохранённых приедет из службы.
    setLook(readSkin());
    void applyPresetCss(look().preset);
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
              aria-label="Оформление"
              value={look().preset ?? ""}
              onChange={(event) => apply({ ...look(), preset: event.currentTarget.value || null })}
            >
              <For each={presets()}>
                {(item) => <option value={item.id}>{item.label}</option>}
              </For>
            </select>
          </Show>

          <button
            type="button"
            class="panel-btn"
            title="Светлая или тёмная пара"
            onClick={() => apply({ ...look(), mode: look().mode === "light" ? "dark" : "light" })}
          >
            ◐
          </button>
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
          <iframe
            ref={frame}
            src={`/?nav=${nonce()}`}
            title="Зона"
            onLoad={() => {
              apply(look(), false);
              watchZone();
            }}
          />
        </Show>
      </div>
    </div>
  );
}
