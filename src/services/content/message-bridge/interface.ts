export interface IMessageBridgeService {
  /**
   * 将指令通过 postMessage 打入主世界，并等待主世界的回应
   */
  pingToMain(payload: string): Promise<boolean>;

  /**
   * 向主世界请求提取金山智能文档的 Markdown 内容
   * @returns 返回解析好的结果对象，失败或超时则返回 null
   */
  requestMarkdownFromMain(): Promise<{ markdown?: string | null, error?: string, debug?: any } | null>;
}
