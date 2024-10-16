import type { SearchParams } from "meilisearch";

type AllowedRecord = Record<string, SearchParams>;
type MapIteratorOfAllowedRecord = MapIterator<
  [keyof AllowedRecord, AllowedRecord[keyof AllowedRecord]]
>;

export class RouterState {
  readonly #searchParamsMap = new Map<string, SearchParams>();
  readonly #callback: (newState: MapIteratorOfAllowedRecord) => void;

  constructor(callback: (newState: MapIteratorOfAllowedRecord) => void) {
    this.#callback = callback;
  }

  #to: ReturnType<typeof setTimeout> | null = null;
  readonly #listeners = new Map<string, Set<(val?: SearchParams) => void>>();
  addListener(indexUid: string, listener: (val?: SearchParams) => void) {
    const currentSearchParams = this.#searchParamsMap.get(indexUid);
    if (currentSearchParams !== undefined) {
      listener(currentSearchParams);
    }

    let listenerSet = this.#listeners.get(indexUid);
    if (listenerSet === undefined) {
      listenerSet = new Set([listener]);
      this.#listeners.set(indexUid, listenerSet);
    } else {
      listenerSet.add(listener);
    }

    let isRemoved = false;
    return {
      removeListener: () => {
        listenerSet.delete(listener);
        if (listenerSet.size === 0) {
          this.#listeners.delete(indexUid);
        }

        isRemoved = true;
      },
      modifySearchParams: (callback: (searchParams: SearchParams) => void) => {
        if (isRemoved) {
          throw new Error("removed, cannot be called anymore");
        }

        const searchParams = this.#searchParamsMap.get(indexUid);
        if (searchParams === undefined) {
          const newSearchParams = {};
          callback(newSearchParams);

          if (Object.keys(newSearchParams).length !== 0) {
            this.#searchParamsMap.set(indexUid, newSearchParams);
          }
        } else {
          callback(searchParams);
          if (Object.keys(searchParams).length === 0) {
            this.#searchParamsMap.delete(indexUid);
          }
        }

        if (this.#to !== null) {
          clearTimeout(this.#to);
        }

        this.#to = setTimeout(() =>
          this.#callback(this.#searchParamsMap.entries())
        );
      },
    };
  }

  #callListeners(indexUid: string, val?: SearchParams): void {
    const listeners = this.#listeners.get(indexUid);
    if (listeners !== undefined) {
      for (const listener of listeners) {
        listener(val);
      }
    }
  }

  setState(state: AllowedRecord): void {
    const stateEntries = new Map(Object.entries(state));

    for (const key of this.#searchParamsMap.keys()) {
      if (!stateEntries.has(key)) {
        this.#searchParamsMap.delete(key);
        this.#callListeners(key, undefined);
      }
    }

    for (const [key, val] of stateEntries) {
      this.#searchParamsMap.set(key, val);
      this.#callListeners(key, val);
    }
  }
}
