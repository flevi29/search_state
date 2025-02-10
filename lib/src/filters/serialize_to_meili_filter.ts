import { type FilterExpression, FilterType } from "./model.ts";

function escapeString(text: string): string {
  return `"${text.replace('"', '\\"')}"`;
}

export function serializeToMeiliFilter(
  filterExpression: FilterExpression,
): string {
  const iter = filterExpression[Symbol.iterator]();

  let filterStr = "";
  let isLastValueOperator = false;

  for (;;) {
    const firstValue = iter.next().value;

    if (firstValue === undefined) {
      if (isLastValueOperator) {
        throw new Error("TODO");
      }

      break;
    }

    if (typeof firstValue === "string") {
      throw new Error("todo");
    }

    isLastValueOperator = false;

    if (Array.isArray(firstValue)) {
      filterStr += `(${serializeToMeiliFilter(firstValue)})`;
    } else {
      // TODO: Escape with quotes
      switch (firstValue.type) {
        case FilterType.OrderOrEq:
          filterStr += `${
            escapeString(firstValue.attribute)
          } ${firstValue.operator} ${escapeString(firstValue.value)}`;
          break;
        case FilterType.To:
          filterStr += `${
            escapeString(firstValue.attribute)
          } ${firstValue.val1} TO ${firstValue.val2}`;
          break;
        case FilterType.OnlyOperator:
          filterStr += `${
            escapeString(firstValue.attribute)
          } ${firstValue.operator}`;
          break;
      }
    }

    const secondValue = iter.next().value;

    if (secondValue === undefined) {
      break;
    }

    if (typeof secondValue !== "string") {
      throw new Error("TODO");
    }

    isLastValueOperator = true;

    filterStr += ` ${secondValue} `;
  }

  return filterStr;
}

const expr: FilterExpression = [
  [
    {
      type: FilterType.OrderOrEq,
      attribute: "a1",
      operator: "==",
      value: "234",
    },
    "OR",
    {
      type: FilterType.OrderOrEq,
      attribute: "a1",
      operator: "==",
      value: "234",
    },
  ],
  "AND",
  [
    {
      type: FilterType.OrderOrEq,
      attribute: "a1",
      operator: "==",
      value: "23\"4",
    },
    "OR",
    {
      type: FilterType.OrderOrEq,
      attribute: "a1",
      operator: "==",
      value: "234",
    },
  ],
];

console.log(serializeToMeiliFilter(expr));
