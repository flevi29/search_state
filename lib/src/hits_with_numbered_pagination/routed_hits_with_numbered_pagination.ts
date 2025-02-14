import type { RoutedHitsWithNumberedPaginationOptions } from "./model.ts";
import { HitsWithNumberedPagination } from "./hits_with_numbered_pagination.ts";

export function getRoutedHitsWithNumberedPagination<
  // deno-lint-ignore no-explicit-any
  T extends Record<string, any> = Record<string, any>,
>(options: RoutedHitsWithNumberedPaginationOptions<T>) {
  const { routerState, callbacks, ...restOfOptions } = options;

  const { removeListener, setPage, setHitsPerPage } =
    routerState.addListenerAndGetSetters(
      ["page", "hitsPerPage"],
      options.indexUid,
      (searchParams) => {
        hitsWithNumberedPagination.setHitsPerPage(
          searchParams?.hitsPerPage ?? null
        );
        hitsWithNumberedPagination.setPage(searchParams?.page ?? null);
      }
    );

  const { hitsPerPageListener, pageListener, unmount, ...restOfCallbacks } =
    callbacks ?? {};

  const hitsWithNumberedPagination = new HitsWithNumberedPagination({
    ...restOfOptions,
    callbacks: {
      ...restOfCallbacks,
      hitsPerPageListener(v, isDefault) {
        setHitsPerPage(isDefault ? undefined : v);
        hitsPerPageListener?.(v, isDefault);
      },
      pageListener(v, isDefault) {
        setPage(isDefault ? undefined : v);
        pageListener?.(v, isDefault);
      },
      unmount() {
        setHitsPerPage(undefined);
        setPage(undefined);
        removeListener();
        unmount?.();
      },
    },
  });

  return hitsWithNumberedPagination;
}
