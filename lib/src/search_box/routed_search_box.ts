import { SearchBox } from "./search_box.ts";
import type { RouterSearchBoxOptions } from "./model.ts";

export function getRoutedSearchBox(options: RouterSearchBoxOptions): SearchBox {
  const { routerState, callbacks, ...restOfOptions } = options;

  const { removeListener, setQ } = routerState.addListenerAndGetSetters(
    ["q"],
    options.indexUid,
    (searchParams) => void searchBox.setQ(searchParams?.q ?? null)
  );

  const { qListener, unmount, ...restOfCallbacks } = callbacks ?? {};

  const searchBox = new SearchBox({
    ...restOfOptions,
    callbacks: {
      ...restOfCallbacks,
      qListener(v, isDefault) {
        setQ(isDefault ? undefined : v);
        qListener?.(v, isDefault);
      },
      unmount() {
        setQ(undefined);
        removeListener();
        unmount?.();
      },
    },
  });

  return searchBox;
}
