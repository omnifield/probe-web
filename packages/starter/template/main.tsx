// Точка входа скелета. Замерзает не файл, а ПОВЕРХНОСТЬ, которую он трогает (kb:PROBEWEB-4):
// mount() рантайма, один примитив из ui и CSS стилевого слоя. Больше отсюда не зовут ничего —
// каждая лишняя строка застынет у потребителя навсегда, а обвес сюда уже не заглянет.
//
// CSS двумя подпутями, и это не дубль: базовый слой не держит ни одного литерального цвета
// (его инвариант), значения приходят темой. Один `/css` дал бы страницу без цветов — браузер
// молча отбросил бы неразрешённые var(). Меняешь тему на свою — эта строка твоя, правь.
import "@omnifield/probe-web-style/css";
import "@omnifield/probe-web-style/themes.css";

import { mount } from "@omnifield/probe-web-runtime";
import { Button } from "@omnifield/probe-web-ui";

function App() {
  return <Button>hello, web</Button>;
}

mount(() => <App />);
