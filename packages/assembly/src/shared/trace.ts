import { createNoter, createTracer } from "@web-core/trace";

export const trace = createTracer("assembly");
export const note = createNoter("assembly");
