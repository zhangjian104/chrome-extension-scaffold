import { BaseHandler } from './BaseHandler';
import { KDocNode, ParserContext } from '../types';
import { KDocParser } from '../KDocParser';

export class CodeBlockHandler implements BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string {
    const lang = node.attrs?.lang || '';
    let codeStr = '';
    if (node.content) {
      // 提取代码内容时，直接拿 text，不要经过转义和 mark 解析
      codeStr = node.content
        .map(child => child.text || '')
        .join('');
    }
    
    // 如果上层不是列表，重置状态
    context.listStateTracker.reset();

    // 计算外层定界符所需的反引号数量
    // 如果代码块内部包含反引号序列，外层至少需要包含一个比内部最长序列多1个的反引号序列
    const backticksMatches = codeStr.match(/`+/g);
    let maxBackticks = 0;
    if (backticksMatches) {
      maxBackticks = Math.max(...backticksMatches.map(match => match.length));
    }
    const fenceLength = Math.max(3, maxBackticks + 1);
    const fence = '`'.repeat(fenceLength);

    return `\n${fence}${lang}\n${codeStr}\n${fence}\n\n`;
  }
}

export class PictureHandler implements BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string {
    const attrs = node.attrs || {};
    const title = attrs.caption || attrs.title || '';
    const src = attrs.src || attrs.href || ''; 
    // 注意：金山本地图片 src 可能为空，只依赖云端资源

    return `![${title}](${src})`;
  }
}

export class LinkViewHandler implements BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string {
    const attrs = node.attrs || {};
    const title = attrs.hrefTitle || attrs.description || '';
    const url = attrs.url || '';
    
    return `[${title}](${url})`;
  }
}

export class EmojiHandler implements BaseHandler {
  handle(node: KDocNode, parser: KDocParser, context: ParserContext): string {
    return node.attrs?.emoji || '';
  }
}
