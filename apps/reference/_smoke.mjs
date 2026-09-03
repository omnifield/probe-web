import { createPresetsSkinSource, PresetsDown, PresetsRefused } from "@omnifield/probe-web-skin/presets";
import { passportOf } from "@omnifield/probe-web-ui/passport";

const source = createPresetsSkinSource({
  url: "http://127.0.0.1:8787/api/presets",
  lookup: passportOf,
});

const names = await source.names();
console.log("names:", names);

const css = await source.css(names[0]);
console.log("css length:", css.length);
console.log(css.slice(0, 400));

try {
  await source.css("нет-такого-наряда");
  console.log("ERROR: ожидался отказ");
} catch (cause) {
  console.log("instanceof PresetsRefused:", cause instanceof PresetsRefused, cause.message);
}

try {
  await createPresetsSkinSource({ url: "http://127.0.0.1:1/api/presets", lookup: passportOf }).names();
  console.log("ERROR: ожидался PresetsDown");
} catch (cause) {
  console.log("instanceof PresetsDown:", cause instanceof PresetsDown, cause.message);
}
