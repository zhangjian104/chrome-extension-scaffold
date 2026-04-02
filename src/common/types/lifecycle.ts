export enum EntityType {
  BACKGROUND = 'background',
  CONTENT_SCRIPT = 'content_script',
  INJECTED_SCRIPT = 'injected_script'
}

export enum LifecycleState {
  UNINITIALIZED = 'UNINITIALIZED', // 未初始化
  INITIALIZING = 'INITIALIZING',   // 初始化中
  REGISTERED = 'REGISTERED',       // 已注册 (资源加载完毕)
  READY = 'READY',                 // 已就绪 (可与其他实体通信)
  ERROR = 'ERROR',                 // 发生错误
  DESTROYED = 'DESTROYED'          // 已销毁
}

export type LifecycleCallback = (state: LifecycleState, payload?: any) => void;
