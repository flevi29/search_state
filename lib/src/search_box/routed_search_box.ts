import { SearchBox } from "./search_box.ts";
import type { RouterSearchBoxOptions } from "./model.ts";

export function getRoutedSearchBox(options: RouterSearchBoxOptions): SearchBox {
  const { routerState, callbacks, ...restOfOptions } = options;

  const { removeListener, modifySearchParams } = routerState.addListener(
    options.indexUid,
    (searchParams) => void searchBox.setQ(searchParams?.q ?? null)
  );

  const { qListener, unmount, ...restOfCallbacks } = callbacks ?? {};

  const searchBox = new SearchBox({
    ...restOfOptions,
    callbacks: {
      ...restOfCallbacks,
      qListener(v, isDefault) {
        modifySearchParams(
          (searchParams) =>
            void (isDefault ? delete searchParams.q : (searchParams.q = v))
        );
        qListener?.(v, isDefault);
      },
      unmount() {
        modifySearchParams((searchParams) => void delete searchParams.q);
        removeListener();
        unmount?.();
      },
    },
  });

  return searchBox;
}
