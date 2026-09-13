// Solid-обвес — тем же приёмом, что `@web-core/skin/solid`. Разбор — README.md/FAQ.md.

export { createValidationConnection, type ValidationConnection } from "./connection.js";
export {
  useComponentValidation,
  useFormValid,
  useIssuesAt,
  useValidation,
  ValidationProvider,
  type ComponentValidation,
  type ValidationProviderProps,
} from "./provider.js";
