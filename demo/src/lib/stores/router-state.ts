import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { RouterState } from "$rootSrc/mod";

export function getRouterState() {
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
        searchParams.entries().map(([key, val]) => [key, JSON.parse(val)]),
      ),
    );
  });

  return { value: routerState, unsubscribe };
}
