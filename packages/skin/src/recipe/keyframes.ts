// Design notes: ./README.md#keyframes

import type { StyleObject } from "./style.js";

export type Keyframes = Readonly<Record<string, StyleObject>>;
