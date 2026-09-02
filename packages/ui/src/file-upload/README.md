# 📤 File Upload

🏷️ inputs · 🧬 component · 📐 regular · 📦 `@omnifield/probe-web-ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

```
root
├─ label 🏷️
├─ dropzone ⬇️
│  └─ trigger 🔘
├─ itemGroup (accepted) 📁
│  └─ item 📄
│     ├─ itemPreview / itemPreviewImage 🖼️
│     ├─ itemName
│     ├─ itemSizeText
│     └─ itemDeleteTrigger ✕
├─ itemGroup (rejected) 📁
│  └─ item 📄 …
└─ clearTrigger 🗑️
```

| часть               | значение                                                                        | принимает внутри                     | рисуется                       |
| -------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| 📤 `root`            | файловый загрузчик целиком — подпись, зона сброса и список выбранных файлов вместе | `label`, `dropzone`, `itemGroup`, `clearTrigger`, любой компонент | `FileUpload`             |
| 🏷️ `label`           | подпись виджета целиком                                                          | текст                                      | `FileUploadLabel`             |
| ⬇️ `dropzone`        | зона сброса — клик открывает выбор файлов, drag-and-drop работает нативно         | `trigger`, текст                           | `FileUploadDropzone`          |
| 🔘 `trigger`         | открывает выбор файлов явной кнопкой — необязательная альтернатива клику по зоне сброса | текст, иконка                        | `FileUploadTrigger`           |
| 🗑️ `clearTrigger`    | убирает разом все принятые файлы — кит прячет её, пока ничего не выбрано          | текст, иконка                              | `FileUploadClearTrigger`      |
| 📁 `itemGroup`       | оборачивает список выбранных файлов — одна группа на принятые, вторая необязательная на отклонённые | `item`                     | `FileUploadItemGroup`         |
| 📄 `item`            | строка одного выбранного файла                                                   | `itemPreview`, `itemName`, `itemSizeText`, `itemDeleteTrigger` | `FileUploadItem`  |
| `itemName`           | имя файла                                                                        | текст                                      | `FileUploadItemName`          |
| `itemSizeText`       | отформатированный размер файла                                                   | текст                                      | `FileUploadItemSizeText`      |
| 🖼️ `itemPreview`     | оборачивает превью файла — миниатюру изображения или обобщённую иконку           | `itemPreviewImage`, иконка                 | `FileUploadItemPreview`       |
| `itemPreviewImage`   | настоящая миниатюра — монтируется только для принятого файла с типом изображения | —                                           | `FileUploadItemPreviewImage`  |
| ✕ `itemDeleteTrigger`| убирает один файл                                                                | текст, иконка                              | `FileUploadItemDeleteTrigger` |

> [!NOTE]
> Настоящий `<input type="file">` смонтирован всегда — кладёт его сам корень `FileUpload`,
> потребителю добавлять его не нужно и нельзя: своего адреса он не несёт, в карту кита не входит и
> наружу из кита не экспортируется вовсе. Это `extras` (см. корневой README кита) — проверка по
> всему киту нашла в этой роли только скрытые инпуты чекбокса и файлового загрузчика, ни одного
> другого случая.

<h2 id="состояния">🎛️ Состояния</h2>

|      | состояние       | метка                    | значение                                                              |
| ---- | ---------------- | -------------------------- | ------------------------------------------------------------------------ |
| 🚫   | disabled         | `[data-disabled]`          | весь виджет отключён                                                     |
| 🔒   | readonly         | `[data-readonly]`          | значение видно, изменить нельзя                                          |
| 🖱️   | dragging         | `[data-dragging]`          | файл сейчас перетаскивают над виджетом / зоной сброса                    |
| ⚠️   | invalid          | `[data-invalid]`           | только что сброшенный или выбранный файл(ы) не прошёл валидацию          |
| ❗   | required         | `[data-required]`          | форма потребует файл при отправке                                        |
| 📥   | accepted         | `[data-type="accepted"]`   | этот файл попал в список принятых                                        |
| 📛   | rejected         | `[data-type="rejected"]`   | этот файл отклонён (размер, тип или превышен лимит количества)           |
| 🖱️   | hover            | `:hover`                    | указатель наведён на эту кнопку                                          |
| 👆   | active           | `:active`                    | кнопка нажата и удерживается                                             |
| ⌨️   | focus-visible    | `:focus-visible`             | фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум       |

Состояния распределены по двенадцати частям неравномерно — честное отражение того, что каждая часть
реально может выражать, а не единый набор для всех:

- `root`/`dropzone` несут `dragging` — перетаскивание файла происходит физически над этими двумя
  узлами, остальные части его не видят.
- `dropzone`/`trigger` несут `invalid` — файл может провалить валидацию и при клике, и при сбросе.
- `label` несёт `required`, а не `disabled`+`readonly`+весь остальной набор — читаемость подписи
  реагирует только на обязательность и отключённость.
- `trigger`/`clearTrigger`/`itemDeleteTrigger` — настоящие кнопки: `hover`/`focus-visible`/`active`
  — псевдоклассы браузера, не `data-*` атрибуты, в отличие от `disabled`/`readonly`, которые здесь
  остаются явными марками.
- Шесть частей внутри `item` (`itemGroup`, `item`, `itemName`, `itemSizeText`, `itemPreview`,
  `itemPreviewImage`, `itemDeleteTrigger`) несут пару `accepted`/`rejected` — какой список занял
  файл, а не то, как он выглядит по отдельности; общий атрибут `data-type` на всех семи, тот же
  приём, что использует `view` датапикера для одного атрибута с более чем двумя осмысленными
  значениями.
- `itemPreviewImage` несёт `rejected` наравне с `accepted`, хотя рисует настоящий `<img>` и падает
  на файле без типа изображения — отклонённый файл может остаться картинкой, просто превысить
  лимит размера, так что пара действительно двузначна и для этой части тоже.
- `clearTrigger`'s нативный `hidden` (виден, пока `acceptedFiles.length === 0`) не адресован
  отдельной маркой — ни один другой атрибут коннектора не называет «список файлов пуст», подменять
  тут нечего.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{ "label": "string" }
```

<h3 id="io-выход">📤 Выход</h3>

Файловый загрузчик ничего не диспатчит через сборку — выбор и удаление файлов ведёт сам виджет
(колбэки `onFileChange`/`onFileAccept`/`onFileReject` на корне), это не событие наружу схемы.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

Рабочая загрузка из данных: один принятый файл, один отклонённый, кнопки удаления кликабельны.

```
root
  label 🏷️ · text: {label}
  dropzone ⬇️
    trigger 🔘 · text: "Выбрать файлы"
  itemGroup (accepted) 📁
    item 📄 · file: resume.pdf
      itemPreview 🖼️ · icon: "📄"
      itemName · text: "resume.pdf"
      itemSizeText · text: "16 Б"
      itemDeleteTrigger ✕ · text: "✕"
  itemGroup (rejected) 📁
    item 📄 · file: video.mp4
      itemPreview 🖼️ · icon: "🎬"
      itemName · text: "video.mp4"
      itemSizeText · text: "превышен лимит"
      itemDeleteTrigger ✕ · text: "✕"
  clearTrigger 🗑️ · text: "Очистить всё"
```

Файлы — настоящие `File` (`new File(...)`), той же категории, что `collection` у select'а или
`DateValue` у датапикера, а не JSON-заглушки: `FileUploadItemProps.file` реально ожидает
инстанс. Обе группы заведены раздельно, а не одной с полем `type` на каждом `item` — реальная
`Item`-компонента Ark вообще не принимает проп `type`, читая «принят/отклонён» с ЗАКРЫВАЮЩЕГО
`itemGroup`, а не с себя.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

Двенадцать частей с неравномерным набором состояний означают не единую сетку, а разное число
слотов на часть — большинство визуально нейтральны, но `skinGaps` требует адресовать все: пустое
правило не засчитывается, поэтому нейтральные случаи оформлены явными, но безобидными правилами
(например, `itemGroup`'s `accepted`/`rejected` — тот же `gap`, что уже в базе, просто явно).
Осмысленные состояния получили реальную разницу: `itemPreview`/`itemPreviewImage` обесцвечиваются
(`grayscale(1)`) для отклонённого файла, `itemName`/`itemSizeText`/`itemDeleteTrigger` красятся в
`--danger-11` там же.

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка. Скрытый
`<input type="file">` класть не нужно — корень несёт его сам.

```tsx
import { createSignal, For } from "solid-js";

const [files, setFiles] = createSignal<File[]>([]);

<FileUpload maxFiles={5} acceptedFiles={files()} onFileChange={(details) => setFiles(details.acceptedFiles)}>
  <FileUploadLabel>Вложения</FileUploadLabel>
  <FileUploadTrigger>Выбрать файл(ы)</FileUploadTrigger>
  <FileUploadItemGroup type="accepted">
    <For each={files()}>
      {(file) => (
        <FileUploadItem file={file}>
          <FileUploadItemName />
          <FileUploadItemDeleteTrigger>✕</FileUploadItemDeleteTrigger>
        </FileUploadItem>
      )}
    </For>
  </FileUploadItemGroup>
</FileUpload>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`. Скрытый ввод кладёт сам корень — сборке о нём знать не нужно.

```tsx
const data = { label: "Файлы" };
const tree = instanceOf("file-upload", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Ограничение по типу и размеру, отклонённые — отдельным списком.**

```tsx
import { createSignal } from "solid-js";

const [accepted, setAccepted] = createSignal<File[]>([]);
const [rejected, setRejected] = createSignal<{ file: File; errors: string[] }[]>([]);

<FileUpload
  accept="image/png,image/jpeg"
  maxFileSize={1024 * 1024}
  acceptedFiles={accepted()}
  onFileAccept={(details) => setAccepted(details.files)}
  onFileReject={(details) => setRejected(details.files)}
>
  <FileUploadLabel>Загрузка изображений (PNG/JPEG, до 1 МБ)</FileUploadLabel>
  <FileUploadDropzone>Перетащите изображения сюда или нажмите для выбора</FileUploadDropzone>
  <FileUploadItemGroup type="accepted">{/* … */}</FileUploadItemGroup>
  <FileUploadItemGroup type="rejected">{/* … */}</FileUploadItemGroup>
</FileUpload>
```

**Дропзона плюс явная кнопка, без двойного открытия пикера.** `disableClick` на дропзоне гасит её
собственный клик, чтобы не срабатывать вместе со вложенным `trigger`.

```tsx
<FileUploadDropzone disableClick>
  <FileUploadTrigger>Выбрать файлы</FileUploadTrigger>
  Перетащите файлы сюда
</FileUploadDropzone>
```

**Превью, подобранное по типу.** `itemPreview`'s проп `type` (по умолчанию `.*`, ловит всё) решает,
какое превью рисуется для данного MIME-типа файла — можно смонтировать несколько `itemPreview` с
разными `type` рядом, отрисуется только подходящий.

```tsx
<FileUploadItem file={file}>
  <FileUploadItemPreview type="image/*">
    <FileUploadItemPreviewImage />
  </FileUploadItemPreview>
  <FileUploadItemPreview type=".*">🗎</FileUploadItemPreview>
  <FileUploadItemName />
</FileUploadItem>
```

`itemPreviewImage` — настоящий `<img>`, падает на файле без типа изображения; ставить его без
охраняющего `type="image/*"` на `itemPreview` нельзя.
