// Design notes: ./README.md#anatomy

import { createAnatomy, type AnatomyPart } from "@zag-js/anatomy";

export { createAnatomy };

export interface PassportAnatomy<Part extends string = string> {
  keys: () => Part[];
  build: () => Record<Part, AnatomyPart>;
}
