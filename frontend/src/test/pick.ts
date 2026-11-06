/** The first item of a list a test just found (fails the test with a clear message when the list is empty). */
export const firstOf = <T>(items: readonly T[]): T => {
  const [item] = items;
  if (item === undefined) throw new Error('Expected at least one item');
  return item;
};

/** The last item of a list a test just found. */
export const lastOf = <T>(items: readonly T[]): T => {
  const item = items.at(-1);
  if (item === undefined) throw new Error('Expected at least one item');
  return item;
};

/** The file input inside an element (the pickers hide it behind a button). */
export const fileInputIn = (root: Element): HTMLInputElement => {
  const input = root.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new Error('No file input found');
  return input;
};
