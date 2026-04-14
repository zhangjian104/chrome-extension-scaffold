import { BaseHandler } from './BaseHandler';
import { KDocNode, ParserContext } from '../types';
import type { IKDocParserService } from '../interface';
import { escapeMarkdown } from '../utils/markdown-utils';

export class TextHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    let text = node.text || '';
    if (!text) return '';

    // 转义普通文本以防破坏 markdown
    // 如果想要完全转义，开启这行代码；如果测试时发现格式全毁了，可以关闭。
    // text = escapeMarkdown(text); 

    if (node.marks && node.marks.length > 0) {
      node.marks.forEach(mark => {
        if (mark.type === 'bold') {
          text = `**${text}**`;
        } else if (mark.type === 'code') {
          text = `\`${text}\``;
        } else if (mark.type === 'italic') {
          text = `*${text}*`;
        } else if (mark.type === 'underline') {
          text = `<u>${text}</u>`; // Markdown 不支持 underline，转为 HTML
        }
      });
    }

    return text;
  }
}

export class HardBreakHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    return '<br/>'; // 考虑到在列表或者其它内联容器中，<br/> 比 \n\n 更稳妥
  }
}

export class ParagraphHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    const isList = !!node.attrs?.listType;
    let prefix = '';

    if (isList) {
      // 提取列表前缀
      prefix = context.listStateTracker.getPrefix(
        node.attrs?.listId || '',
        node.attrs!.listType,
        node.attrs!.listLevel
      );
    } else {
      // 如果不是列表，重置列表状态机
      context.listStateTracker.reset();
    }

    let contentStr = '';
    if (node.content) {
      contentStr = node.content.map(child => parser.renderNode(child)).join('');
    }

    if (isList) {
      // 列表项：用换行保证每一项独立
      return `${prefix}${contentStr}\n`;
    } else {
      // 普通段落：两端空行
      return `\n${contentStr}\n\n`;
    }
  }
}

export class HeadingHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    let contentStr = '';
    if (node.content) {
      contentStr = node.content.map(child => parser.renderNode(child)).join('');
    }

    // 某些 Heading 也可能是列表
    const isList = !!node.attrs?.listType;
    let prefix = '';
    if (isList) {
      prefix = context.listStateTracker.getPrefix(
        node.attrs?.listId || '',
        node.attrs!.listType,
        node.attrs!.listLevel
      );
    } else {
      context.listStateTracker.reset();
      
      // 判断节点类型是否为 outline-title 或者 outline-title-x
      let level = node.attrs?.level || 1;
      if (node.type === 'outline-title') {
        level = 1;
      } else if (node.type.startsWith('outline-title-')) {
        const parsedLevel = parseInt(node.type.replace('outline-title-', ''), 10);
        if (!isNaN(parsedLevel)) {
          level = parsedLevel;
        }
      }

      prefix = '#'.repeat(level) + ' ';
    }

    return `\n${prefix}${contentStr}\n\n`;
  }
}
