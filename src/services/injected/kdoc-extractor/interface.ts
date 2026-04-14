export interface ExtractorResult {
  markdown?: string | null;
  error?: string;
  debug?: any;
}

export interface IKDocExtractorService {
  /**
   * 从当前页面提取金山智能文档数据并转换为 Markdown
   * @returns 提取结果，包含 markdown 内容或错误信息
   */
  extract(): ExtractorResult;
}
