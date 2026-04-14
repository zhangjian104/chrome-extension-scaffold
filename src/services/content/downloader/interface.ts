export interface IDownloaderService {
  /**
   * 将字符串作为文件下载到本地
   * @param content 文件内容 (例如 Markdown 字符串)
   * @param filename 期望保存的文件名，建议带扩展名
   */
  downloadStringAsFile(content: string, filename: string): void;
}
