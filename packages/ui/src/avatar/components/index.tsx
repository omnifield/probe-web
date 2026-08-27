import {
  AvatarFallback as ArkFallback,
  AvatarImage as ArkImage,
  AvatarRoot as ArkRoot,
  type AvatarFallbackProps as ArkFallbackProps,
  type AvatarImageProps as ArkImageProps,
  type AvatarRootProps as ArkRootProps,
} from "@ark-ui/solid/avatar";

import { dropAddress } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";

// Avatar — a picture with a loading-state fallback, from Ark
// (`ark-ui.com/docs/components/avatar`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/avatar`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `avatar.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).

/** Props of `Avatar` — the root. */
export type AvatarProps = ArkRootProps;

/**
 * The avatar's root — ONE node, wraps `image`/`fallback`.
 *
 * @example
 * ```tsx
 * <Avatar>
 *   <AvatarFallback>JD</AvatarFallback>
 *   <AvatarImage src="/jane-doe.jpg" alt="Jane Doe" />
 * </Avatar>
 * ```
 */
export function Avatar(props: AvatarProps) {
  traceLife("ui.avatar");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `AvatarImage`. */
export type AvatarImageProps = ArkImageProps;

/** The picture — a real `<img>`; kept in the DOM even while hidden, so the load event still fires. */
export function AvatarImage(props: AvatarImageProps) {
  traceLife("ui.avatar-image");

  return <ArkImage {...dropAddress(props)} />;
}

/** Props of `AvatarFallback`. */
export type AvatarFallbackProps = ArkFallbackProps;

/** Shown while the image has not loaded (or has none) — initials, an icon, whatever the consumer puts inside it. */
export function AvatarFallback(props: AvatarFallbackProps) {
  traceLife("ui.avatar-fallback");

  return <ArkFallback {...dropAddress(props)} />;
}
