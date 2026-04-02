import { injectable } from 'inversify';
import { LifecycleState, EntityType, LifecycleCallback } from '@/common/types/lifecycle';
import { ILifecycleService } from './interface';

@injectable()
export abstract class BaseLifecycleService implements ILifecycleService {
  abstract readonly entityType: EntityType;
  
  protected currentState: LifecycleState = LifecycleState.UNINITIALIZED;
  protected callbacks: Map<LifecycleState, Set<LifecycleCallback>> = new Map();
  protected childStates: Map<string | number, LifecycleState> = new Map();
  protected childCallbacks: Map<string, Set<() => void>> = new Map();

  getState(): LifecycleState {
    return this.currentState;
  }

  setState(state: LifecycleState, payload?: any): void {
    if (this.currentState === state) return;
    
    this.currentState = state;
    
    // 触发监听该状态的回调
    const stateCallbacks = this.callbacks.get(state);
    if (stateCallbacks) {
      stateCallbacks.forEach(cb => {
        try {
          cb(state, payload);
        } catch (e) {
          console.error(`Error in lifecycle callback for state ${state}:`, e);
        }
      });
    }
  }

  onState(state: LifecycleState, callback: LifecycleCallback): void {
    if (!this.callbacks.has(state)) {
      this.callbacks.set(state, new Set());
    }
    this.callbacks.get(state)!.add(callback);

    // 如果当前已经在这个状态了，立即执行一次
    if (this.currentState === state) {
      callback(state);
    }
  }

  waitUntil(state: LifecycleState): Promise<void> {
    if (this.currentState === state) {
      return Promise.resolve();
    }
    
    return new Promise(resolve => {
      const callback = (currState: LifecycleState) => {
        if (currState === state) {
          this.callbacks.get(state)?.delete(callback);
          resolve();
        }
      };
      this.onState(state, callback);
    });
  }

  getChildState(childId: string | number): LifecycleState {
    return this.childStates.get(childId) || LifecycleState.UNINITIALIZED;
  }

  setChildState(childId: string | number, state: LifecycleState): void {
    this.childStates.set(childId, state);
    
    const key = `${childId}_${state}`;
    const callbacks = this.childCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }

  waitUntilChild(childId: string | number, state: LifecycleState): Promise<void> {
    if (this.getChildState(childId) === state) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const key = `${childId}_${state}`;
      if (!this.childCallbacks.has(key)) {
        this.childCallbacks.set(key, new Set());
      }
      
      const callback = () => {
        this.childCallbacks.get(key)?.delete(callback);
        resolve();
      };
      
      this.childCallbacks.get(key)!.add(callback);
    });
  }
}
