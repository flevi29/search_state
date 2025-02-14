import { type FilterExpression, ParsedFilterType } from "./model.ts";

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
        throw new Error("expected a filter following a logical operator", {
          cause: filterExpression,
        });
      }

      break;
    }

    if (typeof firstValue === "string") {
      throw new Error(
        "expected first value in group to be a filter and filters to be separated by logical operators",
        { cause: filterExpression },
      );
    }

    isLastValueOperator = false;

    if (Array.isArray(firstValue)) {
      filterStr += `(${serializeToMeiliFilter(firstValue)})`;
    } else {
      switch (firstValue.type) {
        case ParsedFilterType.OrderOrEq:
          filterStr += `${
            escapeString(
              firstValue.attribute,
            )
          } ${firstValue.operator} ${escapeString(firstValue.value)}`;
          break;
        case ParsedFilterType.To:
          filterStr += `${
            escapeString(
              firstValue.attribute,
            )
          } ${firstValue.val1} TO ${firstValue.val2}`;
          break;
        case ParsedFilterType.OnlyOperator:
          filterStr += `${
            escapeString(
              firstValue.attribute,
            )
          } ${firstValue.operator}`;
      }
    }

    const secondValue = iter.next().value;

    if (secondValue === undefined) {
      break;
    }

    if (typeof secondValue !== "string") {
      throw new Error("expected a logical operator following a filter", {
        cause: filterExpression,
      });
    }

    isLastValueOperator = true;

    filterStr += ` ${secondValue} `;
  }

  return filterStr;
}
