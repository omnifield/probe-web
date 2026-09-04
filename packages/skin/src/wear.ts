// Design notes: ./README.md#wear
//
// НАДЕВАНИЕ СКИНА — отдельная точка входа, а не корень: единственная (вместе с `./solid`), что
// трогает документ (`<html>`, `localStorage`, `<style>`) — тому, кому нужна только модель или
// только печать CSS, DOM не должен доставаться бесплатно. Переехало из `@web-core/runtime`
// (`PWEB-221`) — механика ВСЕГДА была про скин, `runtime` держала её только ради соседства с
// `mount()`.

export {
  checkStyleOrder,
  makeSkinSwitch,
  type SkinMode,
  type SkinSource,
  type SkinSwitch,
  type SkinSwitchOptions,
  type SkinWearOptions,
  type SkinWorn,
  type StyleMarker,
  type StyleOrderOptions,
  type StyleOrderReport,
  type StyleOrderStatus,
} from "./wear/switch.js";
