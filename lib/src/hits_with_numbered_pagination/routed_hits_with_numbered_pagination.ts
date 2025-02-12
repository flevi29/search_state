import type { RoutedHitsWithNumberedPaginationOptions } from "./model.ts";
import { HitsWithNumberedPagination } from "./hits_with_numbered_pagination.ts";

export function getRoutedHitsWithNumberedPagination<
  // deno-lint-ignore no-explicit-any
  T extends Record<string, any> = Record<string, any>,
>(options: RoutedHitsWithNumberedPaginationOptions<T>) {
  const { routerState, callbacks, ...restOfOptions } = options;

  // TODO: Make RouterState provide some method to manipulate search params instead of directly interacting with the search params object
  //       so we stop repeating ourselves so much (error prone, less simple)
  const { removeListener, modifySearchParams } = routerState.addListener(
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
        modifySearchParams(
          (searchParams) =>
            void (isDefault
              ? delete searchParams.hitsPerPage
              : (searchParams.hitsPerPage = v))
        );
        hitsPerPageListener?.(v, isDefault);
      },
      pageListener(v, isDefault) {
        modifySearchParams(
          (searchParams) =>
            void (isDefault
              ? delete searchParams.page
              : (searchParams.page = v))
        );
        pageListener?.(v, isDefault);
      },
      unmount() {
        modifySearchParams((searchParams) => {
          delete searchParams.hitsPerPage;
          delete searchParams.page;
        });
        removeListener();
        unmount?.();
      },
    },
  });

  return hitsWithNumberedPagination;
}
