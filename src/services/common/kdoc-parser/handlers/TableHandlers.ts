import { BaseHandler } from './BaseHandler';
import { KDocNode, ParserContext } from '../types';
import type { IKDocParserService } from '../interface';

export class TableHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    if (!node.content || node.content.length === 0) return '';

    // 通知内部组件现在处于表格上下文中，比如影响换行策略
    const prevInTable = context.isInsideTable;
    context.isInsideTable = true;

    let rows: string[] = [];

    // 提取所有 row
    node.content.forEach((child, index) => {
      const rowMarkdown = parser.renderNode(child);
      if (rowMarkdown) {
        rows.push(rowMarkdown.trim());
      }
      
      // 如果这是第一行（表头），在它下方追加 Markdown 的表格分隔线
      if (index === 0 && child.type === 'outline-table-row' && child.content) {
        const cellCount = child.content.length;
        const separator = `| ${Array(cellCount).fill('---').join(' | ')} |`;
        rows.push(separator);
      }
    });

    context.isInsideTable = prevInTable;

    return `\n${rows.join('\n')}\n\n`;
  }
}

export class TableRowHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    if (!node.content || node.content.length === 0) return '';

    const cells = node.content.map(child => parser.renderNode(child).trim());
    return `| ${cells.join(' | ')} |`;
  }
}

export class TableCellHandler implements BaseHandler {
  handle(node: KDocNode, parser: IKDocParserService, context: ParserContext): string {
    if (!node.content || node.content.length === 0) return '';

    // 由于金山的单元格也是用 block 嵌套出来的，渲染后可能带有很多换行
    let cellContent = node.content.map(child => parser.renderNode(child)).join('');

    // 清理可能由于子节点（如段落、标题）带入的换行符
    // 1. 去除首尾空白和换行
    cellContent = cellContent.trim();
    // 2. 将单元格内的段落换行替换为 <br/>
    cellContent = cellContent.replace(/\n+/g, '<br/>');
    // 3. 防止子节点中出现了 Markdown 的分隔符 |
    cellContent = cellContent.replace(/\|/g, '\\|');
    
    // 如果内部有 sub_doc 导致的引用前缀，将其移除
    // （在处理 sub_doc 时，如果我们发现处于表格内，也可以禁用 quote 生成）
    cellContent = cellContent.replace(/(<br\/>|^)>\s/g, '$1');

    return cellContent;
  }
}
