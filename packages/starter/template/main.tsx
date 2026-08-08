// Точка входа скелета. Замерзает не файл, а ПОВЕРХНОСТЬ, которую он трогает (kb:PROBEWEB-4):
// mount() рантайма, один примитив из ui и CSS стилевого слоя. Больше отсюда не зовут ничего —
// каждая лишняя строка застынет у потребителя навсегда, а обвес сюда уже не заглянет.
import "@omnifield/probe-web-style/css";

import { mount } from "@omnifield/probe-web-runtime";
import { Button } from "@omnifield/probe-web-ui";

function App() {
  return <Button>hello, web</Button>;
}

mount(() => <App />);
