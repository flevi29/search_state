import { type FilterExpression, FilterType } from "../model.ts";

function escapeString(text: string): string {
  return "'" + text.replace(",", "\\,");
}

export function serializeFilterExpressionToSearchQueryParams(
  filterExpression: FilterExpression,
): string {
  return JSON.stringify(
    filterExpression,
    function (_, value: FilterExpression[number]) {
      if (Array.isArray(value) || typeof value !== "object") {
        return value;
      }

      return `{${
        (value.type === FilterType.OrderOrEq
          ? [
            value.type,
            escapeString(value.attribute),
            escapeString(value.operator),
            escapeString(value.value),
          ]
          : value.type === FilterType.OnlyOperator
          ? [
            value.type,
            escapeString(value.attribute),
            escapeString(value.operator),
          ]
          : [value.type, escapeString(value.attribute), value.val1, value.val2])
          .join()
      }}`;
    },
  );
}
