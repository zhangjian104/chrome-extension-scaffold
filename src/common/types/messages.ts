// 扩展内部通信的 Action 类型
export enum ExtensionAction {
  HACK_INIT = 'HACK_INIT',       // Popup -> Background
  HACK_CONTENT = 'HACK_CONTENT', // Background -> Content
  LIFECYCLE_CONTENT_READY = 'LIFECYCLE_CONTENT_READY', // Content -> Background
}

// 页面内 postMessage 的通信类型
export enum PageMessageType {
  EXT_PING = 'EXT_PING',   // Content -> Main
  PAGE_PONG = 'PAGE_PONG', // Main -> Content
  LIFECYCLE_INJECTED_READY = 'LIFECYCLE_INJECTED_READY', // Inject -> Content
}

export interface ExtensionMessage {
  action: ExtensionAction;
  payload?: any;
}
