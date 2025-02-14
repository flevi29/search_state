import { goto } from "$app/navigation";
// TODO: https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated
import { RouterState } from "@search-state/lib";
import type { Page } from "@sveltejs/kit";

let identifier = 0;
let to: ReturnType<typeof setTimeout> | null = null;
let promiseChain = Promise.resolve();

export const routerState = new RouterState((newState) => {
  const url = new URL(location.href);
  url.search = new URLSearchParams(
    Object.fromEntries(
      // colons could be replaced by something safe like "$"
      newState.map(([key, val]) => [key, JSON.stringify(val)]),
    ),
  ).toString();

  if (to !== null) {
    clearTimeout(to);
  }

  to = setTimeout(
    () =>
      (promiseChain = promiseChain
        .then(() => {
          const promise = goto(url, {
            replaceState: true,
            noScroll: true,
            keepFocus: true,
            state: identifier,
          });

          identifier = identifier + 1;

          return promise;
        })
        .catch(console.error)),
  );
});

export function changeState({ url: { searchParams }, state }: Page): void {
  if (state === identifier) {
    return;
  }

  routerState.setState(
    Object.fromEntries(
      Array.from(searchParams.entries()).map(([key, val]) => [
        key,
        JSON.parse(val),
      ]),
    ),
  );
}
