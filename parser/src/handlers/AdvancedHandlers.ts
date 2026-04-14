import { BaseHandler } from './BaseHandler';
import { KDocNode, ParserContext } from '../types';
import { KDocParser } from '../KDocParser';

// 分栏容器，直接降级透传
export class CircleObjectHandler implements BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string {
    if (!node.content) return '';
    return node.content.map(child => parser.renderNode(child)).join('');
  }
}

// 嵌套高亮块/引用块，转为 Quote
export class SubDocHandler implements BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string {
    if (!node.content) return '';
    
    // 如果已经在表格内部，不再添加 Quote 前缀，直接穿透返回文本
    // 因为 Markdown 表格的单元格内部不支持原生的 Markdown Blockquote
    if (context.isInsideTable) {
      return node.content.map(child => parser.renderNode(child)).join('');
    }

    const prevQuoteState = context.isInsideQuote;
    context.isInsideQuote = true;
    
    const contentStr = node.content.map(child => parser.renderNode(child)).join('');
    
    context.isInsideQuote = prevQuoteState;

    // 为每一行添加 > 前缀
    const quoteLines = contentStr.split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => `> ${line}`)
      .join('\n');
      
    return `\n${quoteLines}\n\n`;
  }
}
