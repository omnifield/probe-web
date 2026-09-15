import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

/** RAF-буферизация: `source` может обновляться чаще раза за кадр (быстрый стриминг токенов), но
 *  DOM пишем не чаще раза в кадр — «буферизация вместо релейаута на каждый чанк» из рыночной
 *  разведки (ROADMAP.yaml, `chat-market-research`). Когда источник не льётся быстрее кадра,
 *  буферизация не заметна — задержка не больше одного `requestAnimationFrame`. */
export function useBufferedText(source: Accessor<string>): Accessor<string> {
  const [buffered, setBuffered] = createSignal(source());
  let frame: number | undefined;

  createEffect(() => {
    source();
    if (frame !== undefined) return;
    frame = requestAnimationFrame(() => {
      frame = undefined;
      setBuffered(source());
    });
  });

  onCleanup(() => {
    if (frame !== undefined) cancelAnimationFrame(frame);
  });

  return buffered;
}
