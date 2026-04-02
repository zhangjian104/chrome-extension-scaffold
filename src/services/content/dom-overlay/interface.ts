export interface IDomOverlayService {
  /**
   * 在当前页面右上角显示一个悬浮窗状态
   */
  showStatus(message: string, isSuccess?: boolean): void;
}
