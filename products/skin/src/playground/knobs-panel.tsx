// Панель настройки вида — правая колонка стенда.
//
// Живёт отдельным файлом, потому что `app.tsx` про РАСКЛАДКУ. Смешивать раскладку с содержимым
// панели — верный способ получить файл, в котором не найти ни то, ни другое.
//
// ГЛАВНОЕ В ПАНЕЛИ — ПРЕСЕТ, а не отдельные ручки. Сверху сказано, чем зона живёт (выбор пульта
// или свой), под ним выбор пресета, признак «изменён» с сохранением, дальше ручки. Порядок
// именно такой: сначала «чем живу», потом «что подключено», потом «чем правлю».
//
// ФОРМА СОХРАНЕНИЯ — В ОКНЕ, а не в панели (решение user 2026-08-17): поля имени и пояснения
// нужны раз в сотню правок, а места в колонке занимали бы всегда. Панель остаётся редактором
// вида, а не бланком.
//
// Управление сделано нашими компонентами (подсказка, список выбора, переключатель, поле, окно):
// стенд ест свой корм, и криво лёгший селект в узкой колонке я увижу первым.

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Field,
  Input,
  Label,
  Switch,
  SwitchControl,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
  Textarea,
} from "@omnifield/probe-web-ui";
import { createSignal, Show } from "solid-js";

import { KnobLabel, KnobSelect } from "./knob-ui.jsx";
import { ACCENTS, type createKnobs, DENSITIES, RADIUS_STEPS } from "./knobs.js";

/** Панель настройки вида. */
export function Knobs(props: { knobs: ReturnType<typeof createKnobs> }) {
  // Читаем через функцию, а не выдёргиваем в переменную: `props` реактивны, и снятое из них
  // значение перестало бы обновляться. Правило `solid/reactivity` пресета `lint` это поймало.
  const k = () => props.knobs;

  const [open, setOpen] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);
  const [name, setName] = createSignal("");
  const [hint, setHint] = createSignal("");

  const submit = async () => {
    await k().save(name(), hint());
    // Окно закрывается только когда служба взяла пресет: иначе человек унесёт уверенность, что
    // сохранил, а на деле его отказали.
    if (k().refusal() === null) {
      setOpen(false);
      setName("");
      setHint("");
    }
  };

  return (
    <div class="knobs">
      {/* ── чем живёт зона ─────────────────────────────────────────────────────────────── */}
      <div class="knob">
        <KnobLabel
          text="Вид"
          hint="Тему задаёт ХОЗЯИН — пульт или приложение, в которое встроена зона: она её читает, а не выбирает. Тронули ручку здесь — зона отвязалась и живёт своим до перезагрузки страницы. Состояний ровно два, третьего нет."
        />
        <p class="knob__hint">
          <Show when={k().own()} fallback={<>тема хозяина — ручки здесь её перебьют</>}>
            своя тема — хозяин эту зону не перебивает
          </Show>
        </p>
      </div>

      {/* ── пресет ─────────────────────────────────────────────────────────────────────── */}
      <KnobSelect
        label="Пресет"
        hint="Полный набор значений вида: семена шкал, скругление, интервалы, кегль, плотность. Подключается целиком — как костюм, а не по одной вещи. Механика компонентов от пресета не меняется."
        options={k()
          .presets()
          .map((p) => ({ id: p.id, label: p.origin === "свой" ? `${p.title} (свой)` : p.title }))}
        value={k().preset()?.id ?? ""}
        onChange={k().usePreset}
      />

      {/* НЕТ ПРЕСЕТА — НЕТ СКИНА, и это рабочее состояние, а не поломка: удалить можно любой,
          включая семя. Компоненты остаются на умолчаниях базы — оформление необязательно. */}
      <Show when={k().presets().length === 0 && k().source() === "служба"}>
        <p class="knobs__refusal">
          пресетов нет — вид не подключён. Вернуть семя: <code>pnpm run seed:presets</code>
        </p>
      </Show>

      {/* Откуда перечень — говорится ВСЛУХ. Молчаливая работа на встроенных означала бы, что
          человек сохранит пресет и не поймёт, почему его не видит коллега. */}
      <p class="knob__hint">
        <Show
          when={k().source() === "служба"}
          fallback={
            <>
              перечень встроенный: {k().trouble() ?? "служба не отвечает"} — сохранить пресет для
              других сейчас нельзя
            </>
          }
        >
          перечень из службы — сохранённое здесь видят все
        </Show>
      </p>

      {/* Признак «изменён» показывается ТОЛЬКО когда есть что сохранять: постоянная плашка
          перестаёт читаться как сообщение и становится частью фона. */}
      <Show when={k().dirty()}>
        <div class="knobs__dirty">
          <p class="knob__hint">
            Пресет изменён ручками. Сохраните — он появится в списке наравне с остальными, и его
            можно будет подключить в приложении.
          </p>

          <div class="knobs__row">
            <Button
              data-size="sm"
              disabled={k().source() !== "служба" || k().busy()}
              onClick={() => {
                setName(`${k().preset()?.title ?? ""} — правка`);
                setOpen(true);
              }}
            >
              Сохранить…
            </Button>
            <Button data-size="sm" data-variant="outline" onClick={() => k().reset()}>
              Вернуть
            </Button>
          </div>
        </div>
      </Show>

      {/* УДАЛИТЬ МОЖНО ЛЮБОЙ, включая семя (решение user 2026-08-17): «своих» пресетов больше нет,
          все они общие. Именно поэтому здесь спрашивается подтверждение: удаление стирает пресет
          У ВСЕХ, а не только на этом экране, и вернуть его можно только сохранив заново. */}
      <Show when={k().preset() !== undefined && !k().dirty()}>
        <AlertDialog open={confirming()} onOpenChange={setConfirming}>
          <AlertDialogTrigger
            as={Button}
            data-size="sm"
            data-variant="danger-outline"
            disabled={k().busy() || k().source() !== "служба"}
          >
            <span data-icon="trash-2" aria-hidden="true" />
            Удалить пресет
          </AlertDialogTrigger>

          <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogContent>
              <AlertDialogTitle>Удалить «{k().preset()?.title}»?</AlertDialogTitle>
              <AlertDialogDescription>
                Пресет уйдёт из службы у всех, кто ей пользуется. Действие необратимо: вернуть
                можно только сохранив пресет заново.
              </AlertDialogDescription>

              <div class="knobs__row">
                <Button
                  data-variant="danger"
                  disabled={k().busy()}
                  onClick={() => {
                    void k().drop();
                    setConfirming(false);
                  }}
                >
                  Удалить
                </Button>
                <AlertDialogClose as={Button} data-variant="outline">
                  Отмена
                </AlertDialogClose>
              </div>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      </Show>

      {/* Отказ службы по делу — не «нет связи», и показывается отдельно: пресет НЕ сохранён. */}
      <Show when={k().refusal()}>
        {(said) => <p class="knobs__refusal">служба не приняла: {said()}</p>}
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

      <p class="knobs__note">
        Ручки ставят семена на корень документа — там же, где их поставит потребитель. На
        контейнере они не работают: производные и роли вычисляются там, где объявлены.
      </p>

      {/* ── окно сохранения ────────────────────────────────────────────────────────────── */}
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogTitle>Сохранить пресет</DialogTitle>
            <DialogDescription>
              Уедет в службу и станет виден всем, кто открыл стенд. Подключается файлом плюс
              атрибутом <code>data-theme</code> — способ от службы не меняется.
            </DialogDescription>

            <Field>
              <Label>Название</Label>
              <Input
                value={name()}
                placeholder="например: пульт продаж"
                onInput={(event) => setName(event.currentTarget.value)}
              />
            </Field>

            <Field>
              <Label>Пояснение</Label>
              <Textarea
                value={hint()}
                placeholder="зачем этот вид и где он уместен — необязательно"
                onInput={(event) => setHint(event.currentTarget.value)}
              />
            </Field>

            <Show when={k().refusal()}>
              {(said) => <p class="knobs__refusal">служба не приняла: {said()}</p>}
            </Show>

            <div class="knobs__row">
              <Button disabled={k().busy()} onClick={() => void submit()}>
                {k().busy() ? "сохраняю…" : "Сохранить"}
              </Button>
              <DialogClose as={Button} data-variant="outline">
                Отмена
              </DialogClose>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
