import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type FileUploadPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const disabledMeans = { disabled: { means: "весь виджет отключён" } } satisfies PassportPartEditorInfo<FileUploadPart>["states"];
const disabledReadonlyMeans = {
  disabled: { means: "весь виджет отключён" },
  readonly: { means: "значение видно, изменить нельзя" },
} satisfies PassportPartEditorInfo<FileUploadPart>["states"];
const itemTypeMeans = {
  accepted: { means: "этот файл попал в список принятых" },
  rejected: { means: "этот файл отклонён (размер, тип или превышен лимит количества)" },
} satisfies PassportPartEditorInfo<FileUploadPart>["states"];
const buttonPseudoMeans = {
  hover: { means: "указатель наведён на эту кнопку" },
  "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
  active: { means: "кнопка нажата и удерживается" },
} satisfies PassportPartEditorInfo<FileUploadPart>["states"];

export const parts: Readonly<Record<FileUploadPart, PassportPartEditorInfo<FileUploadPart>>> = {
  root: {
    means: "файловый загрузчик целиком — подпись, зона сброса и список выбранных файлов вместе",
    states: { ...disabledReadonlyMeans, dragging: { means: "файл сейчас перетаскивают над виджетом" } },
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "dropzone" },
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "clearTrigger" },
      { kind: "component" },
    ],
  },
  dropzone: {
    means: "зона сброса — клик открывает выбор файлов, drag-and-drop работает нативно",
    states: {
      ...disabledReadonlyMeans,
      dragging: { means: "файл сейчас перетаскивают прямо над зоной сброса" },
      invalid: { means: "только что сброшенный или выбранный файл(ы) не прошёл валидацию" },
    },
    accepts: [
      { kind: "component", name: "trigger" },
      { kind: "content", genus: "text" },
    ],
  },
  label: {
    means: "подпись виджета целиком",
    states: { ...disabledMeans, required: { means: "форма потребует файл при отправке" } },
    accepts: [{ kind: "content", genus: "text" }],
  },
  trigger: {
    means: "открывает выбор файлов явной кнопкой — необязательная альтернатива клику по зоне сброса",
    states: { ...disabledReadonlyMeans, invalid: { means: "только что выбранный файл(ы) не прошёл валидацию" }, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  clearTrigger: {
    means: "убирает разом все принятые файлы — кит прячет её, пока ничего не выбрано",
    states: { ...disabledReadonlyMeans, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  itemGroup: {
    means: "оборачивает список выбранных файлов — одна группа на принятые, вторая необязательная на отклонённые",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [{ kind: "component", name: "item" }],
  },
  item: {
    means: "строка одного выбранного файла",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [
      { kind: "component", name: "itemPreview" },
      { kind: "component", name: "itemName" },
      { kind: "component", name: "itemSizeText" },
      { kind: "component", name: "itemDeleteTrigger" },
    ],
  },
  itemName: {
    means: "имя файла",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemSizeText: {
    means: "отформатированный размер файла",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemPreview: {
    means: "оборачивает превью файла — миниатюру изображения или обобщённую иконку для остальных типов",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [
      { kind: "component", name: "itemPreviewImage" },
      { kind: "content", genus: "icon" },
    ],
  },
  itemPreviewImage: {
    means: "настоящая миниатюра — монтируется только для принятого файла с типом изображения",
    states: { ...disabledMeans, ...itemTypeMeans },
    accepts: [],
  },
  itemDeleteTrigger: {
    means: "убирает один файл",
    states: { ...disabledReadonlyMeans, ...itemTypeMeans, ...buttonPseudoMeans },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
