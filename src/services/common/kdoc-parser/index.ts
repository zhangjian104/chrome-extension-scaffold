import { injectable } from 'inversify';
import type { IKDocParserService } from './interface';
import { KDocNode, ParserContext } from './types';
import { handlers, blockContainerHandler } from './handlers';
import { cleanEmptyLines } from './utils/markdown-utils';
import { ListStateTracker } from './utils/list-state';

@injectable()
export class KDocParserService implements IKDocParserService {
  private context!: ParserContext;

  public parse(docJson: KDocNode): string {
    // 每次调用时重新初始化上下文，确保无状态可复用
    const listDatas = (docJson as any).attrs?.listdatas || {};
    this.context = {
      listDatas,
      listStateTracker: new ListStateTracker(listDatas),
      isInsideQuote: false
    };

    const rawMarkdown = this.renderNode(docJson);
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

export type { IKDocParserService } from './interface';
export * from './types';
