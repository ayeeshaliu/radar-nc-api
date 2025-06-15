/**
 * Returns a function that will only execute the given function once and return the result on
 * subsequent calls.
 *
 * @param fn
 */

export function lazy<T>(fn: () => T): () => T {
  let value: T;
  return () => {
    if (!value) {
      value = fn();
    }
    return value;
  };
}
