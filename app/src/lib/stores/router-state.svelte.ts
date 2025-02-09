import { goto } from "$app/navigation";
// TODO: https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated
import { page } from "$app/stores";
import { RouterState } from "@search-state/lib";

function getRouterState() {
  let identifier = 0,
    to: ReturnType<typeof setTimeout> | null = null,
    promiseChain = Promise.resolve();
  const routerState = new RouterState((newState) => {
    const urlSearchParams = new URLSearchParams(
      Object.fromEntries(
        newState.map(([key, val]) => [key, JSON.stringify(val)]),
      ),
    );

    if (to !== null) {
      clearTimeout(to);
    }

    to = setTimeout(() =>
      (promiseChain = promiseChain
        .then(() =>
          goto(
            // TODO: Investigate how to remove search params
            // urlSearchParams.size === 0 ? "." :
            // below solution sometimes keeps dangling "?"
            `?${urlSearchParams.toString()}`,
            {
              replaceState: true,
              noScroll: true,
              keepFocus: true,
              state: identifier,
            },
          ),
        )
        .catch(console.error)).finally(
        () => void (identifier = identifier < 50 ? identifier + 1 : 0),
      ),
    );
  });

  const unsubscribe = page.subscribe(({ url: { searchParams }, state }) => {
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
  });

  return { value: routerState, unsubscribe };
}

export const routerState = (() => {
  let routerState = $state<ReturnType<typeof getRouterState> | null>(null);

  return {
    set: () => void (routerState = getRouterState()),
    unset(): void {
      if (routerState !== null) {
        routerState.unsubscribe();
        routerState = null;
      }
    },
    get value() {
      return routerState?.value;
    },
  };
})();
