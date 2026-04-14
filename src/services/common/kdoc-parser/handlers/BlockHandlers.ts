import { BaseHandler } from './BaseHandler';
import { KDocNode, ParserContext } from '../types';
import { KDocParser } from '../KDocParser';

export class BlockContainerHandler implements BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string {
    if (!node.content) return '';
    return node.content.map(child => parser.renderNode(child)).join('');
  }
}
