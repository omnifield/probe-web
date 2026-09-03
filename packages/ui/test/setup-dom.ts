// jsdom не реализует `ResizeObserver`/`IntersectionObserver` вовсе — настоящие Zag-машины
// (slider/tabs/radio-group/scroll-area/segment-group) зовут их напрямую (`syncIndicatorRect`/
// `trackThumbSize`/`trackContentResize`/`trackViewportVisibility`), и без заглушки падают
// `TypeError: win.XxxObserver is not a constructor`. Заглушки no-op — тестам не нужны реальные
// размеры/пересечения, только чтобы конструктор существовал и не бросал.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class IntersectionObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
