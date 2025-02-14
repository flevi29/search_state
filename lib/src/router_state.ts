import type { SearchParams } from "meilisearch";

type SearchParamsMap = Map<
  keyof SearchParams,
  SearchParams[keyof SearchParams]
>;

type HuhType = (keyof SearchParams)[];

type MyOtherType<T extends HuhType> = {
  [TKey in T[number]]: SearchParams[TKey];
};

function pickFromSearchParamsMap<
  const T extends HuhType,
  U extends MyOtherType<T>,
>(searchParamsMap: SearchParamsMap, keys: T): U {
  return Object.fromEntries(
    keys.map((key) => [key, searchParamsMap.get(key)])
  ) as U;
}

type SearchParamsListener = (val?: SearchParams) => void;

export type AllowedRecord = Record<string, SearchParams>;
export type AllowedRecordHuhWhat = [
  keyof AllowedRecord,
  AllowedRecord[keyof AllowedRecord],
][];

export type RenameThisType<T extends HuhType> = {
  removeListener: () => void;
} & {
  [TKey in T[number] as `set${Capitalize<TKey>}`]: (
    value: SearchParams[TKey]
  ) => void;
};

export class RouterState {
  readonly #indexMapOfSearchParamsMap = new Map<string, SearchParamsMap>();
  readonly #callback: () => void;

  constructor(callback: (newState: AllowedRecordHuhWhat) => void) {
    this.#callback = () =>
      callback(
        Array.from(this.#indexMapOfSearchParamsMap.entries()).map(
          ([key, val]) => [key, Object.fromEntries(val.entries())] as const
        )
      );
  }

  #to?: ReturnType<typeof setTimeout>;
  readonly #listeners = new Map<string, Set<[SearchParamsListener, HuhType]>>();

  addListenerAndGetSetters<const T extends HuhType, U extends MyOtherType<T>>(
    keys: T,
    indexUid: string,
    listener: (searchParams: U) => void
  ): RenameThisType<T> {
    const currentSearchParamsMap =
      this.#indexMapOfSearchParamsMap.get(indexUid);
    if (currentSearchParamsMap !== undefined) {
      listener(pickFromSearchParamsMap(currentSearchParamsMap, keys));
    }

    const listenerAndKeys: [SearchParamsListener, T] = [
      listener as SearchParamsListener,
      keys,
    ];

    let listenerSet = this.#listeners.get(indexUid);
    if (listenerSet === undefined) {
      listenerSet = new Set([listenerAndKeys]);
      this.#listeners.set(indexUid, listenerSet);
    } else {
      listenerSet.add(listenerAndKeys);
    }

    let isRemoved = false;
    // deno-lint-ignore no-explicit-any
    const obj: Record<string, (...args: any[]) => void> = {
      removeListener: () => {
        listenerSet.delete(listenerAndKeys);
        if (listenerSet.size === 0) {
          this.#listeners.delete(indexUid);
        }

        isRemoved = true;
      },
    };

    for (const key of keys) {
      obj[`set${key.charAt(0).toUpperCase}${key.slice(1)}`] = (
        v: SearchParams[typeof key]
      ) => {
        if (isRemoved) {
          throw new Error("removed, cannot be called anymore");
        }

        if (this.#to !== undefined) {
          clearTimeout(this.#to);
        }

        const searchParams = this.#indexMapOfSearchParamsMap.get(indexUid);

        if (searchParams === undefined) {
          this.#indexMapOfSearchParamsMap.set(indexUid, new Map([[key, v]]));
        } else {
          if (v === undefined) {
            searchParams.delete(key);

            if (searchParams.size === 0) {
              this.#indexMapOfSearchParamsMap.delete(indexUid);
            }
          } else {
            searchParams.set(key, v);
          }
        }

        this.#to = setTimeout(() => {
          this.#callback();
          this.#to = undefined;
        });
      };
    }

    return obj as RenameThisType<T>;
  }

  #callListeners(indexUid: string, val?: SearchParamsMap): void {
    const listeners = this.#listeners.get(indexUid);
    if (listeners !== undefined) {
      for (const [listener, keys] of listeners) {
        listener(val !== undefined ? pickFromSearchParamsMap(val, keys) : {});
      }
    }
  }

  setState(state: AllowedRecord): void {
    for (const key of this.#indexMapOfSearchParamsMap.keys()) {
      if (!Object.hasOwn(state, key)) {
        this.#indexMapOfSearchParamsMap.delete(key);
        this.#callListeners(key);
      }
    }

    for (const [key, val] of Object.entries(state)) {
      const searchParamsMap = this.#indexMapOfSearchParamsMap.get(key)!;

      for (const searchParamsMapKey of searchParamsMap.keys()) {
        if (!Object.hasOwn(val, searchParamsMapKey)) {
          searchParamsMap.delete(searchParamsMapKey);
        }
      }

      for (const [valKey, valVal] of Object.entries(val)) {
        searchParamsMap.set(valKey as keyof SearchParams, valVal);
      }

      this.#callListeners(key, searchParamsMap);
    }
  }
}
