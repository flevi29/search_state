import type { SearchState } from "./search_state.ts";

// deno-lint-ignore no-explicit-any
export type WithParamsExceptFirst<TFn extends (...args: any[]) => any> =
  // deno-lint-ignore no-explicit-any
  TFn extends (...args: [any, ...infer TArgsExceptFirst]) => infer TReturn
    ? (...args: TArgsExceptFirst) => TReturn
    : never;

// deno-lint-ignore no-explicit-any
export type WithParamsExceptFirstTwo<TFn extends (...args: any[]) => any> =
  // deno-lint-ignore no-explicit-any
  TFn extends (...args: [any, any, ...infer TArgsExceptFirst]) => infer TReturn
    ? (...args: TArgsExceptFirst) => TReturn
    : never;

export function getState(state?: SearchState): SearchState {
  if (state === undefined) {
    throw new Error("widget has been unmounted");
  }

  return state;
}

// deno-lint-ignore no-explicit-any
type GenericVoidFunction = (...args: any[]) => void;

export function addListener(
  mapOfIndexListeners: Map<string, Set<GenericVoidFunction>>,
  indexUid: string,
  listener: GenericVoidFunction,
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
