// deno-lint-ignore no-explicit-any
export class PeekableIterator<T, TReturn = any, TNext = any>
  implements Iterator<T, TReturn, TNext> {
  readonly #iterator: Iterator<T, TReturn, TNext>;
  #peekedValue?: IteratorResult<T, TReturn>;

  constructor(iterator: Iterator<T, TReturn, TNext>) {
    this.#iterator = iterator;
  }

  peek(): IteratorResult<T, TReturn> {
    if (this.#peekedValue !== undefined) {
      return this.#peekedValue;
    }

    return (this.#peekedValue = this.#iterator.next());
  }

  next(): IteratorResult<T, TReturn> {
    if (this.#peekedValue !== undefined) {
      const peeked = this.#peekedValue;
      this.#peekedValue = undefined;
      return peeked;
    }

    return this.#iterator.next();
  }

  [Symbol.iterator]() {
    return this;
  }
}
