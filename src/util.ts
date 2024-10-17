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
