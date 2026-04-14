import { KDocNode, ParserContext } from './types';
import { handlers, blockContainerHandler } from './handlers';
import { cleanEmptyLines } from './utils/markdown-utils';
import { ListStateTracker } from './utils/list-state';

export class KDocParser {
  private context: ParserContext;

  constructor(docJson: any) {
    debugger;
    const listDatas = docJson.attrs?.listdatas || {};
    this.context = {
      listDatas,
      listStateTracker: new ListStateTracker(listDatas),
      isInsideQuote: false
    };
  }

  public parse(ast: KDocNode): string {
    const rawMarkdown = this.renderNode(ast);
    return cleanEmptyLines(rawMarkdown);
  }

  public renderNode(node: KDocNode): string {
    if (!node || !node.type) return '';

    const handler = handlers[node.type];
    if (handler) {
      return handler.handle(node, this, this.context);
    }

    // 兜底策略：如果不认识该类型的节点，但它包含子节点，将其作为普通容器处理
    if (node.content && Array.isArray(node.content)) {
      return blockContainerHandler.handle(node, this, this.context);
    }

    return '';
  }
}
