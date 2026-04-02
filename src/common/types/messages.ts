// 扩展内部通信的 Action 类型
export enum ExtensionAction {
  HACK_INIT = 'HACK_INIT',       // Popup -> Background
  HACK_CONTENT = 'HACK_CONTENT'  // Background -> Content
}

// 页面内 postMessage 的通信类型
export enum PageMessageType {
  EXT_PING = 'EXT_PING',   // Content -> Main
  PAGE_PONG = 'PAGE_PONG'  // Main -> Content
}

export interface ExtensionMessage {
  action: ExtensionAction;
  payload: any;
}
