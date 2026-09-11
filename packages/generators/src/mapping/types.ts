export interface MappingTemplate<TItem = unknown, TOutput = unknown> {
  readonly name: string;
  isEntry(raw: string): boolean;
  collect(raw: string): readonly TItem[] | Promise<readonly TItem[]>;
  validate?(items: readonly TItem[]): void | Promise<void>;
  render(items: readonly TItem[]): TOutput | Promise<TOutput>;
}
