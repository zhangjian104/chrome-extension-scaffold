export interface IInjectedMessageBridgeService {
  /**
   * 启动对 Content Script 消息的监听
   */
  startListening(): void;
  
  /**
   * 停止监听
   */
  stopListening(): void;
}
