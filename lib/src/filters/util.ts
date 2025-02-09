import { PeekableIterator } from "./peekable_iterator.ts";

type ParsedCondition = {
  attribute: string;
  operator: string;
  value: string;
};

export type ParsedFilterExpression = (
  | ParsedCondition
  | string
  | ParsedFilterExpression
)[];

// const asd: ParsedFilterExpression = [
//   [
//     [
//       { attribute: "genres", operator: "=", value: "comedy" },
//       "OR",
//       { attribute: "genres", operator: "=", value: "horror" },
//     ],
//     "AND",
//     { attribute: "genres", operator: "=", value: "comedy" },
//     "OR",
//     { attribute: "genres", operator: "=", value: "horror" },
//   ],
//   "AND",
//   { attribute: "director", operator: "!=", value: "Jordan Peele" },
//   "AND",
//   [
//     [
//       { attribute: "genres", operator: "=", value: "comedy" },
//       "OR",
//       { attribute: "genres", operator: "=", value: "horror" },
//     ],
//     "AND",
//     { attribute: "genres", operator: "=", value: "comedy" },
//     "OR",
//     { attribute: "genres", operator: "=", value: "horror" },
//   ],
// ];

// Array.isArray => group (first one is omitted, implicitly always group, no brackets required)
// typeof var === "string" => operator between filters
// _ => Asd

// https://www.meilisearch.com/docs/learn/filtering_and_sorting/filter_expression_reference
const BRACKET_OPEN = "(",
  BRACKET_CLOSE = ")",
  DOUBLEQ = '"',
  SINGLEQ = "'",
  ESCAPE = "\\",
  SPACE = " ";

// function isIndexBetweenSearchStrings(
//   filter: string,
//   index: number,
//   searchString: string
// ): boolean {
//   let isBetween = false,
//     lastIndexOfDoubleQ = filter.lastIndexOf(searchString, index);
//   while (lastIndexOfDoubleQ !== -1) {
//     if (filter.charAt(lastIndexOfDoubleQ) !== ESCAPE) {
//       isBetween = !isBetween;
//     }

//     lastIndexOfDoubleQ = filter.lastIndexOf(searchString, lastIndexOfDoubleQ);
//   }

//   return isBetween;
// }

// function isIndexBetweenQuotes(filter: string, index: number): boolean {
//   return (
//     isIndexBetweenSearchStrings(filter, index, DOUBLEQ) ||
//     isIndexBetweenSearchStrings(filter, index, SINGLEQ)
//   );
// }

// function getGroupAsFilter(filter: string, startingIndex: number): string {
//   const endOfGroupIndex = filter.indexOf(BRACKET_CLOSE, startingIndex);

//   if (endOfGroupIndex === -1) {
//     throw new SyntaxError("expected closing bracket");
//   }

//   if (!isIndexBetweenQuotes(filter, endOfGroupIndex)) {
//     return getGroupAsFilter(filter, endOfGroupIndex);
//   }

//   return filter.substring(startingIndex, endOfGroupIndex);
// }

function* getUnescapedIterator(
  filter: string,
  searchString: string,
): Generator<number, void, undefined> {
  let index: number | undefined;

  for (;;) {
    index = filter.indexOf(
      searchString,
      index !== undefined ? index + 1 : index,
    );

    if (index === -1) {
      return;
    }

    if (filter.charAt(index - 1) === ESCAPE) {
      continue;
    }

    yield index;
  }
}

// 1. start out with the one with the lowest index, get its second counterpart
// 2. while number provided to yield is between these two indexes, keep them
// 3. as soon as it's not, try to find the next quotes
// 4. next other quote until it's not between first two indexes, next the main quote, check again which comes first
// 5. repeat from first step
// 6. if there are no more quotes, return
// 7. if there are dangling quotes, throw error
function* getEscapeSequenceIterator(
  filter: string,
): Generator<number, undefined, undefined> {
  const singleIter = getUnescapedIterator(filter, SINGLEQ),
    doubleIter = getUnescapedIterator(filter, DOUBLEQ);

  let indexSingle = singleIter.next().value,
    indexDouble = doubleIter.next().value;

  // TODO: Rename
  function* getIteratorForIdk(
    index: number,
    iter: Generator<number, void, undefined>,
  ) {
    const indexNext = iter.next().value;
    if (indexNext === undefined) {
      throw new SyntaxError("no closing q");
    }

    yield index;
    yield indexNext;

    switch (iter) {
      case singleIter:
        indexSingle = iter.next().value;
        break;
      case doubleIter:
        indexDouble = iter.next().value;
        break;
    }

    return indexNext;
  }

  for (;;) {
    if (indexSingle === undefined) {
      if (indexDouble === undefined) {
        return;
      }

      yield* getIteratorForIdk(indexDouble, doubleIter);
      continue;
    }

    if (indexDouble === undefined) {
      yield* getIteratorForIdk(indexSingle, singleIter);
      continue;
    }

    const iter = indexSingle < indexDouble ? singleIter : doubleIter,
      index = iter === singleIter ? indexSingle : indexDouble,
      nextIndex = yield* getIteratorForIdk(index, iter);

    switch (iter) {
      case singleIter:
        indexSingle = iter.next().value;
        while (indexDouble !== undefined && indexDouble < nextIndex) {
          indexDouble = doubleIter.next().value;
        }
        break;

      case doubleIter:
        indexDouble = iter.next().value;
        while (indexSingle !== undefined && indexSingle < nextIndex) {
          indexSingle = singleIter.next().value;
        }
    }
  }
}

function* getNonSpaceIterator(
  filter: string,
  indexes: [ind1: number, ind2: number],
): Generator<
  Iterable<number, undefined, undefined>,
  undefined,
  [ind1: number, ind2: number]
> {
  if (filter === "") {
    return;
  }

  const nonSpaceIndexIter = (function* (): Generator<
    number,
    undefined,
    undefined
  > {
    let previousSpaceIndex: number | undefined, spaceIndex: number | undefined;

    for (;;) {
      previousSpaceIndex = spaceIndex;
      spaceIndex = filter.indexOf(
        SPACE,
        spaceIndex !== undefined ? spaceIndex + 1 : undefined,
      );

      // in case no next
      if (spaceIndex === -1) {
        yield previousSpaceIndex !== undefined ? previousSpaceIndex + 1 : 0;
        yield filter.length;
        return;
      }

      // in case first
      if (previousSpaceIndex === undefined) {
        if (spaceIndex !== 0) {
          yield 0;
          yield spaceIndex;
        }

        continue;
      }

      const maybeNonSpaceIndex = previousSpaceIndex + 1;
      if (maybeNonSpaceIndex !== spaceIndex) {
        yield maybeNonSpaceIndex;
        yield spaceIndex;
      }
    }
  })();

  let nextVal = nonSpaceIndexIter.next().value;
  function* getIteratorOfNonSpaceCharactersBetweenIndexes(): Generator<
    number,
    undefined,
    undefined
  > {
    const [ind1, ind2] = indexes;

    for (;;) {
      if (nextVal === undefined || nextVal > ind2) {
        return;
      }

      if (nextVal >= ind1) {
        yield nextVal;
      }

      nextVal = nonSpaceIndexIter.next().value;
    }
  }

  for (;;) {
    if (nextVal === undefined) {
      break;
    }

    indexes = yield getIteratorOfNonSpaceCharactersBetweenIndexes();
  }
}

function* getGroupCharIterator(
  filter: string,
): Generator<number, undefined, undefined> {
  let index1 = filter.indexOf(BRACKET_OPEN),
    index2 = filter.indexOf(BRACKET_CLOSE);

  for (;;) {
    if (index1 === -1 && index2 === index1) {
      return;
    }

    if (index1 === -1 || index1 > index2) {
      yield index2;
      index2 = filter.indexOf(BRACKET_CLOSE, index2 + 1);
    } else {
      yield index1;
      index1 = filter.indexOf(BRACKET_OPEN, index1 + 1);
    }
  }
}

function parseFilterExpression(filter: string): ParsedFilterExpression {
  const groupIter = getGroupCharIterator(filter),
    escapeSequenceIter = new PeekableIterator(
      getEscapeSequenceIterator(filter),
    );

  let indexEscSeqOpen = escapeSequenceIter.next().value,
    indexEscSeqClose = escapeSequenceIter.next().value;

  const nonSpaceIter = getNonSpaceIterator(filter, [
    0,
    indexEscSeqOpen ?? filter.length,
  ]);

  // 1. quotes
  //    - whatever there is between quotes counts as either ATTRIBUTE or VALUE
  //    - need to skip ahead `nonWhiteSpaceIter` and group until we're out of this first quote sequence, but not in the next quote sequence
  // 2. gorups
  //    - when we meet a group we start a procedure starting from current index
  //    - this procedure will return the index where it finished and a resulting `ParsedFilterExpression`
  //    - should be recursive
  // 3. non-white-space sequences
  //    - this is in the form of either a single string corresponding to an expression operator, or 3 strings for a condition
  function recursiveFn(): ParsedFilterExpression {
    const parsedFilter: ParsedFilterExpression = [],
      collectedStrings: string[] = [];
    let gIndex = groupIter.next().value;

    mainLoop: for (;;) {
      // skips group char iter ahead while it's
      // between current quotes, or doesn't exist anymore
      if (indexEscSeqOpen !== undefined) {
        while (
          gIndex !== undefined &&
          indexEscSeqOpen < gIndex &&
          gIndex < indexEscSeqClose!
        ) {
          gIndex = groupIter.next().value;
        }
      }

      // skips quotes ahead if they're smaller than our current group char
      if (gIndex !== undefined) {
        if (indexEscSeqOpen !== undefined) {
          const nextEscSeqOpen = escapeSequenceIter.peek().value;

          if (nextEscSeqOpen !== undefined && gIndex > nextEscSeqOpen) {
            const dsa =
              nonSpaceIter.next([indexEscSeqClose!, nextEscSeqOpen]).value;
            if (dsa !== undefined) {
              for (const asd of dsa) {
                // uhh this won't work very well, cause they come in pairs
              }
            }

            indexEscSeqOpen = nextEscSeqOpen;
            escapeSequenceIter.next();
            indexEscSeqClose = escapeSequenceIter.next().value!;
            continue;
          }
        }

        // TODO: Collect strings

        // group char is vlaid
        if (filter.charAt(gIndex) === BRACKET_CLOSE) {
          // end group
          break;
        }

        // start a new group
        parsedFilter.push(recursiveFn());
      }

      // - group char index is undescaped and processed at this point or undefined
      //   - this means we can get the next one
      // - escape sequence indexes are one of:
      //   - undefined, none left to process
      //   - defined
      //     - if there are more group indexes, just continue to next loop
      //     - otherwise process remaining, uhh, stuff

      if (gIndex !== undefined) {
        gIndex = groupIter.next().value;
        continue;
      }

      while (indexEscSeqOpen !== undefined) {
        let nextNonSpaceIndex: number | undefined;
        for (;;) {
          nextNonSpaceIndex = nonSpaceIter.peek().value;
          if (nextNonSpaceIndex === undefined) {
            // TODO: Before breaking collect though
            break mainLoop;
          }

          if (nextNonSpaceIndex > indexEscSeqOpen) {
            break;
          }

          nonSpaceIter.next();
          nonSpaceIter.next();
        }

        indexEscSeqOpen = escapeSequenceIter.next().value;
        indexEscSeqClose = escapeSequenceIter.next().value!;
      }

      let nextNonSpaceIndex: number | undefined;
      for (;;) {
        nextNonSpaceIndex = nonSpaceIter.peek().value;
        if (nextNonSpaceIndex === undefined) {
          break mainLoop;
        }

        nonSpaceIter.next();
        nonSpaceIter.next();
      }
    }

    return parsedFilter;
  }

  return recursiveFn();
}

console.log(
  parseFilterExpression(
    `(dowework = "(yes)" AND "dowework" = "no") AND ("dowework" = yes AND dowework = no)`,
  ),
);

// export function parseFilterExpression(filter: string): ParsedFilterExpression {
//   const parsedFilterExpression: ParsedFilterExpression = [];

//   let i = 0,
//     isCapturing = false,
//     currentEscapeCharacter = null;
//   while (i < filter.length) {
//     // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt
//     // might wanna give that a looksey
//     const char = filter.charAt(i);

//     if (char === BRACKET_OPEN && !isIndexBetweenQuotes(filter, i)) {
//       const group = getGroupAsFilter(filter, i);
//       parsedFilterExpression.push(parseFilterExpression(group));

//       i += group.length - 2;
//       continue;
//     }

//     // should use indexOf to find non-space characters or any of the quotes, perhaps with regex
//     const indexOfSpace = filter.indexOf(SPACE, i),
//       indexOfDoubleQ = filter.indexOf(DOUBLEQ, i),
//       indexOfSingleQ = filter.indexOf(SINGLEQ, i);

//     if (char === SPACE && currentEscapeCharacter === null) {
//       // TODO: If we're currently capturing something space can mean finishing capture
//       continue;
//     }

//     if (char === DOUBLEQ || char === SINGLEQ) {
//       if (currentEscapeCharacter === null) {
//         currentEscapeCharacter = char;
//         continue;
//       }

//       if (currentEscapeCharacter === char && filter.charAt(i - 1) !== ESCAPE) {
//         // TODO: close escape sequence
//       }
//     }

//     i += 1;
//   }

//   return parsedFilterExpression;
// }
