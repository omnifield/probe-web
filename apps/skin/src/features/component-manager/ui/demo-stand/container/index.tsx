import { createMemo, For } from "solid-js";
import {
  CarouselItem,
  CarouselItemGroup,
  CarouselRootProvider,
  useCarousel,
  type UseCarouselReturn,
} from "@web-core/ui";

const MOCK_VARIANTS = [
  { name: "default", assemblies: ["base", "compact", "wide"] },
  { name: "outline", assemblies: ["base", "compact"] },
  { name: "ghost", assemblies: ["base", "compact", "wide", "full"] },
];

function InnerAssemblies(props: {
  assemblies: string[];
  onReady: (api: UseCarouselReturn) => void;
}) {
  const inner = useCarousel({ slideCount: props.assemblies.length });
  props.onReady(inner);

  return (
    <CarouselRootProvider value={inner}>
      <CarouselItemGroup>
        <For each={props.assemblies}>
          {(assembly, index) => (
            <CarouselItem index={index()}>{assembly}</CarouselItem>
          )}
        </For>
      </CarouselItemGroup>
    </CarouselRootProvider>
  );
}

export function StandContainer() {
  const outer = useCarousel({ slideCount: MOCK_VARIANTS.length });
  const innerApis: UseCarouselReturn[] = [];

  const activeInner = createMemo(() => innerApis[outer().page]);

  return (
    <div>
      <div style={{ position: "sticky", top: "0" }}>
        <button onClick={() => activeInner()?.().scrollPrev()}>‹ сборка</button>
        <button onClick={() => activeInner()?.().scrollNext()}>сборка ›</button>
      </div>

      <CarouselRootProvider value={outer}>
        <CarouselItemGroup>
          <For each={MOCK_VARIANTS}>
            {(variant, index) => (
              <CarouselItem index={index()}>
                <p>{variant.name}</p>
                <InnerAssemblies
                  assemblies={variant.assemblies}
                  onReady={(api) => (innerApis[index()] = api)}
                />
              </CarouselItem>
            )}
          </For>
        </CarouselItemGroup>
      </CarouselRootProvider>
    </div>
  );
}
