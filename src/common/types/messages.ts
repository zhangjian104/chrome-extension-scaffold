// 扩展内部通信的 Action 类型
export enum ExtensionAction {
  LIFECYCLE_CONTENT_READY = 'LIFECYCLE_CONTENT_READY', // Content -> Background
  EXPORT_MARKDOWN = 'EXPORT_MARKDOWN', // Popup -> Content
  CHECK_PAGE = 'CHECK_PAGE', // Popup -> Content（检查当前页面是否支持导出）
}

// 页面内 postMessage 的通信类型
export enum PageMessageType {
  LIFECYCLE_INJECTED_READY = 'LIFECYCLE_INJECTED_READY', // Inject -> Content
  REQ_EXPORT_MARKDOWN = 'REQ_EXPORT_MARKDOWN', // Content -> Injected
  RES_EXPORT_MARKDOWN = 'RES_EXPORT_MARKDOWN', // Injected -> Content
  REQ_CHECK_PAGE = 'REQ_CHECK_PAGE', // Content -> Injected（询问页面类型）
  RES_CHECK_PAGE = 'RES_CHECK_PAGE', // Injected -> Content（返回页面类型检查结果）
}

export interface ExtensionMessage {
  action: ExtensionAction;
  payload?: any;
}
