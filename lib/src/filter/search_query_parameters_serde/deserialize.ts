import {
  type FilterExpression,
  type ParsedFilter,
  ParsedFilterType,
} from "../model.ts";

function unescapeString(text?: string): string {
  if (text === undefined || text.charAt(0) !== "'") {
    throw new Error("TODO");
  }

  return text.slice(1).replace("\\,", ",");
}

function* deserializeFilter(
  filter: string,
): Generator<string, undefined, undefined> {
  let index: number | undefined;
  let lastIndex: number | undefined;
  for (;;) {
    lastIndex = index;
    index = filter.indexOf(",", index !== undefined ? index + 1 : undefined);

    yield filter.slice(lastIndex !== undefined ? lastIndex + 1 : 0, index);

    if (index === undefined) {
      return;
    }
  }
}

export function deserializeFilterExpressionFromSearchQueryParams(
  filterExpression: string,
): FilterExpression {
  try {
    return JSON.parse(filterExpression, function (_, value: string):
      | string
      | ParsedFilter {
      if (value.at(0) !== "{" || value.at(-1) !== "}") {
        return value;
      }

      const deserIter = deserializeFilter(value.slice(1, -1));
      const type = Number(deserIter.next().value);

      switch (type) {
        case ParsedFilterType.OrderOrEq:
          return {
            type,
            operator: unescapeString(deserIter.next().value),
            attribute: unescapeString(deserIter.next().value),
            value: unescapeString(deserIter.next().value),
          };
        case ParsedFilterType.OnlyOperator:
          return {
            type,
            operator: unescapeString(deserIter.next().value),
            attribute: unescapeString(deserIter.next().value),
          };
        case ParsedFilterType.To:
          return {
            type,
            attribute: unescapeString(deserIter.next().value),
            val1: Number(deserIter.next().value),
            val2: Number(deserIter.next().value),
          };
        default:
          throw new Error("TODO");
      }
    });
  } catch (error) {
    throw new Error(`failed to parse filter expression: ${filterExpression}`, {
      cause: error,
    });
  }
}
