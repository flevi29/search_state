import type { SearchParams } from "meilisearch";
import type { RouterState } from "../router_state.ts";

export class SearchBoxRouter {
  readonly #removeListener: () => void;
  readonly #modifySearchParams: (
    callback: (searchParams: SearchParams) => void
  ) => void;

  constructor(
    indexUid: string,
    routerState: RouterState,
    qListener: (q: string) => void
  ) {
    const { removeListener, modifySearchParams } = routerState.addListener(
      indexUid,
      (searchParams) => qListener(searchParams?.q ?? "")
    );
    this.#removeListener = removeListener;
    this.#modifySearchParams = modifySearchParams;
  }

  readonly setQ = (q?: string): void => {
    this.#modifySearchParams(
      (searchParams) =>
        void (q === undefined || q === ""
          ? delete searchParams.q
          : (searchParams.q = q))
    );
  };

  readonly unmount = (): void => {
    this.#removeListener();
  };
}
