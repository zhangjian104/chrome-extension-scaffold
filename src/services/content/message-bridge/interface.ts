export interface IMessageBridgeService {
  /**
   * 向主世界请求提取金山智能文档的 Markdown 内容
   * @returns 返回解析好的结果对象，失败或超时则返回 null
   */
  requestMarkdownFromMain(): Promise<{ markdown?: string | null, error?: string, debug?: any } | null>;
}
