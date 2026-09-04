import { createNoter, createTracer } from "@web-core/shared/trace";

export const trace = createTracer("assembly");
export const note = createNoter("assembly");
