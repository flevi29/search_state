import type { MultiSearchQuery } from "meilisearch";

export type Filter = NonNullable<MultiSearchQuery["filter"]>;

export const ParsedFilterType = Object.freeze({
  OrderOrEq: 0,
  OnlyOperator: 1,
  To: 2,
});

type TypeOfParsedFilterType = typeof ParsedFilterType;

export type ParsedFilterType =
  TypeOfParsedFilterType[keyof TypeOfParsedFilterType];

export type ParsedFilter =
  | {
    type: TypeOfParsedFilterType["OrderOrEq"];
    operator: string;
    attribute: string;
    value: string;
  }
  | {
    type: TypeOfParsedFilterType["OnlyOperator"];
    operator: string;
    attribute: string;
  }
  | {
    type: TypeOfParsedFilterType["To"];
    attribute: string;
    val1: number;
    val2: number;
  };

export type FilterExpression = (ParsedFilter | string | FilterExpression)[];
