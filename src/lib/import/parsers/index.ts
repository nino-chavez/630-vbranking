export { FinishesParser } from './finishes-parser.js';
export { ColleyParser } from './colley-parser.js';
export type { MatchFileParser, ParsedMatchRow } from './match-parser.js';

import type { ImportFormat, FileParserInterface, ParsedFinishesRow, ParsedColleyRow } from '../types.js';
import { FinishesParser } from './finishes-parser.js';
import { ColleyParser } from './colley-parser.js';

/**
 * Factory function that returns the correct parser instance for a given format.
 *
 * @param format - The import format ('finishes' or 'colley')
 * @returns A parser instance implementing FileParserInterface
 * @throws Error if the format is not supported
 */
export function getParser(
  format: ImportFormat,
): FileParserInterface<ParsedFinishesRow> | FileParserInterface<ParsedColleyRow> {
  switch (format) {
    case 'finishes':
      return new FinishesParser();
    case 'colley':
      return new ColleyParser();
    default:
      throw new Error(`Unsupported import format: ${format satisfies never}`);
  }
}
