export interface ITabManagerService {
  /**
   * 将消息发送给当前激活的 Reddit 页面
   */
  sendToActiveRedditTab(payload: any): Promise<any>;
}
