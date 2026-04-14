// 扩展内部通信的 Action 类型
export enum ExtensionAction {
  LIFECYCLE_CONTENT_READY = 'LIFECYCLE_CONTENT_READY', // Content -> Background
  EXPORT_MARKDOWN = 'EXPORT_MARKDOWN', // Popup -> Content
}

// 页面内 postMessage 的通信类型
export enum PageMessageType {
  LIFECYCLE_INJECTED_READY = 'LIFECYCLE_INJECTED_READY', // Inject -> Content
  REQ_EXPORT_MARKDOWN = 'REQ_EXPORT_MARKDOWN', // Content -> Injected
  RES_EXPORT_MARKDOWN = 'RES_EXPORT_MARKDOWN', // Injected -> Content
}

export interface ExtensionMessage {
  action: ExtensionAction;
  payload?: any;
}
