export interface IMessageBridgeService {
  /**
   * 将指令通过 postMessage 打入主世界，并等待主世界的回应
   */
  pingToMain(payload: string): Promise<boolean>;
}
