import { KDocNode, ParserContext } from '../types';
import { KDocParser } from '../KDocParser';

export interface BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string;
}
