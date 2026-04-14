import { BaseHandler } from './BaseHandler';
import { KDocNode, ParserContext } from '../types';
import type { IKDocParserService } from '../interface';

export class BlockContainerHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    if (!node.content) return '';
    return node.content.map(child => parser.renderNode(child)).join('');
  }
}
