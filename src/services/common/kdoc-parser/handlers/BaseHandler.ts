import { KDocNode, ParserContext } from '../types';
import type { IKDocParserService } from '../interface';

export interface BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string;
}
