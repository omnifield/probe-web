# 🗔 Dialog

<h2 id="главное">🏠 Главное</h2>

🏷️ overlays · 🧬 component · 📐 regular · 📦 `@web-core/ui`

Модальное окно поверх страницы 🗔 — используйте, когда пользователь должен закончить или отменить
одно конкретное действие, прежде чем вернуться к остальному: подтверждение, форма, важное
сообщение. В отличие от поповера, диалог по умолчанию блокирует страницу вокруг себя целиком —
фокус захвачен, скролл заблокирован, остальной контент скрыт от скринридера.

<h2 id="анатомия">🧩 Анатомия</h2>

```
positioner
└─ content
   ├─ title
   ├─ description
   └─ closeTrigger
```

`trigger`/`backdrop` — реальные соседи `positioner` в разметке, не его предки и не потомки.

| часть          | значение                                     | принимает внутри                     | рисуется               |
| --------------- | ---------------------------------------------- | --------------------------------------- | ------------------------ |
| 🔘 `trigger`    | открывает диалог                               | текст, иконку                            | `DialogTrigger`         |
| ⬛ `backdrop`   | затемнённая подложка за диалогом               | ничего                                   | `DialogBackdrop`        |
| 🎯 `positioner` | центрирует содержимое во вьюпорте — чистая обёртка, своего вида не несёт | `content`  | `DialogPositioner`      |
| 🗔 `content`    | собственная панель диалога                     | `title`, `description`, `closeTrigger`, любой компонент | `DialogContent` |
| 🏷️ `title`      | заголовок                                      | текст                                    | `DialogTitle`            |
| 📝 `description`| описание                                       | текст                                    | `DialogDescription`      |
| ✕ `closeTrigger`| закрывает диалог                               | текст, иконку                            | `DialogCloseTrigger`     |

> [!NOTE]
> Частей семь, но нет части `root` — сам `Dialog` рисует не DOM-узел, а чистый контекст. Паспорт
> называет своим номинальным корнем `positioner` — часть, которая реально держит то, чем диалог
> визуально является (`content` со всем содержимым внутри). У `positioner` в `accepts` нет
> `trigger`/`backdrop` — они настоящие соседи по разметке, а не потомки; собрать их в одно дерево
> схема не может.

<h2 id="использование">🚀 Использование</h2>

От ручной композиции до диалога-предупреждения и общей панели на несколько триггеров — каждый
сценарий подключается отдельно. 🔀

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<Dialog>
  <DialogTrigger>Открыть</DialogTrigger>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>Заголовок</DialogTitle>
      <DialogDescription>Описание</DialogDescription>
      <DialogCloseTrigger>✕</DialogCloseTrigger>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

**Рендер через движок** — та же композиция плавающей половины, но по схеме (сборка `basic`),
которую рисует `RenderTree`. Реестр должен знать про `provider: Dialog` для этого компонента —
без контекста вокруг `positioner` он падает при попытке его прочитать.

```tsx
const data = { title: "Добро пожаловать", description: "Войдите в аккаунт, чтобы продолжить." };
const tree = instanceOf("dialog", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Диалог-предупреждение, для подтверждения опасного действия.** `role="alertdialog"` — не только
семантика: фокус по умолчанию уходит на кнопку закрытия/отмены, а клик снаружи диалог не закрывает.

```tsx
<Dialog role="alertdialog">
  <DialogTrigger>Удалить аккаунт</DialogTrigger>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>Точно удалить?</DialogTitle>
      <DialogDescription>Действие необратимо.</DialogDescription>
      <DialogCloseTrigger>Отмена</DialogCloseTrigger>
      <button data-variant="danger" onClick={deleteAccount}>Удалить</button>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

**Общий диалог на несколько триггеров.** `value` у триггера различает, какой из них открыл диалог
— тот же приём, что у `drawer`/`popover`.

```tsx
<Dialog onTriggerValueChange={(details) => setActiveUserId(details.value)}>
  <For each={users}>{(user) => <DialogTrigger value={user.id}>Изменить {user.name}</DialogTrigger>}</For>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>Изменение пользователя</DialogTitle>
      <DialogCloseTrigger>✕</DialogCloseTrigger>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

<h2 id="состояния">🎛️ Состояния</h2>

|      | состояние      | метка                    | где                          | значение                                            |
| ---- | --------------- | -------------------------- | ------------------------------ | ------------------------------------------------------ |
| 🔓🔒 | open / closed   | `[data-state]`              | trigger, backdrop, content     | диалог открыт / закрыт                                |
| 🎯   | current         | `[data-current]`            | trigger                        | в диалоге с несколькими триггерами — тот, что его открыл |
| 🖱️   | hover           | `:hover`                    | trigger, closeTrigger           | указатель наведён                                     |
| ⌨️   | focus-visible   | `:focus-visible`            | trigger, closeTrigger           | фокус пришёл с клавиатуры                             |
| 👆   | active          | `:active`                   | trigger, closeTrigger           | нажат указателем                                      |

`positioner`/`title`/`description` своих состояний не несут — чистая раскладка и текст. У
`positioner` нет и переменных геометрии, в отличие от поповера/селекта: диалог центрируется
обычным CSS, не привязан к триггеру `@zag-js/popper`'ом.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{ "title": "string", "description": "string" }
```

<h3 id="io-выход">📤 Выход</h3>

Диалог ничего не диспатчит через сборку — открытие/закрытие ведёт настоящая машина состояний
Ark сама, не событие наружу схемы.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

```
positioner 🎯 · providerProps: defaultOpen
  content 🗔
    title 🏷️ · text: {title}
    description 📝 · text: {description}
    closeTrigger ✕ · text: "✕"
```

> [!NOTE]
> Сборка показывает только «плавающую половину» — `trigger`/`backdrop` в это дерево структурно не
> попадают (см. предупреждение в разделе «Анатомия»), рабочий клик собирается или рендерится
> отдельно, рядом. `providerProps: { defaultOpen: true }` раскрывает панель без реального клика —
> движку сборки нужен контекст `Dialog` вокруг `positioner`, тот же приём `RenderTree`, что даёт
> поповеру и меню state снаружи их собственного DOM-узла.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

`positioner` фиксирован на весь экран (`position: fixed; inset: 0`) с `pointer-events: none` —
пропускает клики фону под собой везде, КРОМЕ `content`, которая сама возвращает `pointer-events:
auto`. `backdrop` — отдельный полноэкранный слой под ним, с затемнением. Открытие/закрытие
`content` анимируется именованными кадрами (`dialog-in`/`dialog-out`), тем же приёмом, что и у
остальных компонентов кита.

<h2 id="доступность">♿ Доступность</h2>

Диалог следует паттерну WAI-ARIA [Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
— фокус попадает внутрь панели при открытии и не выходит за её пределы, пока она открыта, а после
закрытия возвращается туда, откуда пришёл. ⌨️

| Клавиша            | Действие                                                    |
| ------------------- | ------------------------------------------------------------ |
| `Enter` (на триггере) | Открывает диалог                                            |
| `Tab`               | Переносит фокус на следующий элемент внутри панели, не выпуская наружу |
| `Shift + Tab`       | Переносит фокус на предыдущий элемент внутри панели           |
| `Esc`               | Закрывает диалог и возвращает фокус триггеру                  |
