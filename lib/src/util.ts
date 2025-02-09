import type { SearchState } from "./search_state.ts";

// deno-lint-ignore no-explicit-any
export type WithParamsExceptFirst<TFn extends (...args: any[]) => any> =
  // deno-lint-ignore no-explicit-any
  TFn extends (...args: [any, ...infer TArgsExceptFrist]) => infer TReturn
    ? (...args: TArgsExceptFrist) => TReturn
    : never;

// deno-lint-ignore no-explicit-any
export type WithParamsExceptFirstTwo<TFn extends (...args: any[]) => any> =
  // deno-lint-ignore no-explicit-any
  TFn extends (...args: [any, any, ...infer TArgsExceptFrist]) => infer TReturn
    ? (...args: TArgsExceptFrist) => TReturn
    : never;

export function getState(state?: SearchState): SearchState {
  if (state === undefined) {
    throw new Error("widget has been unmounted");
  }

  return state;
}

// deno-lint-ignore no-explicit-any
type GenericFunction = (...args: any[]) => void;

export function addListener(
  mapOfIndexListeners: Map<string, Set<GenericFunction>>,
  indexUid: string,
  listener: GenericFunction,
): () => void {
  let indexListeners = mapOfIndexListeners.get(indexUid);
  if (indexListeners === undefined) {
    indexListeners = new Set();
    mapOfIndexListeners.set(indexUid, indexListeners);
  }

  indexListeners.add(listener);
  return () => {
    indexListeners.delete(listener);
    if (indexListeners.size === 0) {
      mapOfIndexListeners.delete(indexUid);
    }
  };
}
