import { LifecycleState, EntityType, LifecycleCallback } from '@/common/types/lifecycle';

export interface ILifecycleService {
  /**
   * 当前实体的类型
   */
  readonly entityType: EntityType;
  
  /**
   * 获取当前状态
   */
  getState(): LifecycleState;

  /**
   * 变更状态并触发事件
   */
  setState(state: LifecycleState, payload?: any): void;

  /**
   * 监听特定的状态变化
   */
  onState(state: LifecycleState, callback: LifecycleCallback): void;

  /**
   * 等待直到某个状态发生 (返回 Promise)
   */
  waitUntil(state: LifecycleState): Promise<void>;
  
  /**
   * 获取子实体的状态
   */
  getChildState?(childId: string | number): LifecycleState;

  /**
   * 等待子实体到达特定状态
   */
  waitUntilChild?(childId: string | number, state: LifecycleState): Promise<void>;
}
