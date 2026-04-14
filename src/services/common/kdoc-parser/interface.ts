import type { KDocNode } from './types';

export interface IKDocParserService {
  /**
   * 将金山智能文档的 JSON AST 解析为 Markdown 字符串
   * @param docJson 文档的完整 JSON 数据（包含 attrs.listdatas 等元信息）
   * @returns 解析后的 Markdown 纯文本
   */
  parse(docJson: KDocNode): string;

  /**
   * 渲染单个 AST 节点为 Markdown 片段（供 handlers 内部回调使用）
   */
  renderNode(node: KDocNode): string;
}
