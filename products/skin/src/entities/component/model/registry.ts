import {
  createRegistry,
  type ReadableComponent,
  type ReadablePart,
  type Registry,
  type SelfAssembly,
} from "@omnifield/probe-web-assembly";
import { KIT } from "@omnifield/probe-web-ui";
import { admits, editorInfoOf, type PassportEditorInfo } from "@omnifield/probe-web-ui/passport";

function readable(component: string): ReadableComponent {
  const { passport, parts, provider } = KIT[component]!;
  const editorInfo: PassportEditorInfo | undefined = editorInfoOf(component);

  if (!editorInfo) {
    throw new Error(
      `витрина: у компонента «${component}» нет среза редактора — род и допуск объявить нечем`,
    );
  }

  return {
    passport: {
      component: passport.component,
      genus: editorInfo.genus,
      anatomy: passport.anatomy,
      root: passport.root,
      parts: passport.parts.map(
        (part): ReadablePart => ({
          name: part.name,
          accepts: editorInfo.parts[part.name]?.accepts,
        }),
      ),
      selfAssembly: passport.selfAssembly as SelfAssembly | undefined,
    },
    parts,
    ...(provider ? { provider } : {}),
  };
}

export const REGISTRY: Registry = createRegistry({
  components: Object.fromEntries(Object.keys(KIT).map((name) => [name, readable(name)])),
  admits,
});
