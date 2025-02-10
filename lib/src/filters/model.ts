export const FilterType = Object.freeze({
  OrderOrEq: 0,
  OnlyOperator: 1,
  To: 2,
});

type TypeOfFilterType = typeof FilterType;

export type FilterType = TypeOfFilterType[keyof TypeOfFilterType];

export type Filter =
  | {
      type: TypeOfFilterType["OrderOrEq"];
      operator: string;
      attribute: string;
      value: string;
    }
  | {
      type: TypeOfFilterType["OnlyOperator"];
      operator: string;
      attribute: string;
    }
  | {
      type: TypeOfFilterType["To"];
      attribute: string;
      val1: number;
      val2: number;
    };

export type FilterExpression = (Filter | string | FilterExpression)[];


