import type { SearchState } from "./search_state.ts";

export function getState(state?: SearchState): SearchState {
  if (state === undefined) {
    throw new Error("widget has been unmounted");
  }

  return state;
}
