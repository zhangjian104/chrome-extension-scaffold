import { injectable, inject } from 'inversify';
import { BaseLifecycleService } from '@/services/common/lifecycle/base';
import { EntityType, LifecycleState } from '@/common/types/lifecycle';
import { ExtensionMessage, ExtensionAction } from '@/common/types/messages';
import { Logger } from '@/common/logger';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';

@injectable()
export class BackgroundLifecycleService extends BaseLifecycleService {
  readonly entityType = EntityType.BACKGROUND;

  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {
    super();
    this.initListeners();
  }

  private initListeners() {
    // 监听来自 Content Script 的消息
    chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
      if (request.action === ExtensionAction.LIFECYCLE_CONTENT_READY && sender.tab?.id) {
        this.logger.info(`Tab [${sender.tab.id}] Content Script 已就绪`);
        this.setChildState(sender.tab.id, LifecycleState.READY);
      }
    });

    // 监听 Tab 移除，清理状态
    chrome.tabs.onRemoved.addListener((tabId) => {
      if (this.childStates.has(tabId)) {
        this.childStates.delete(tabId);
        // 清理相关的回调
        for (const key of this.childCallbacks.keys()) {
          if (key.startsWith(`${tabId}_`)) {
            this.childCallbacks.delete(key);
          }
        }
        this.logger.info(`Tab [${tabId}] 状态已清理`);
      }
    });
    
    // 监听状态变更输出日志
    this.onState(LifecycleState.READY, () => {
      this.logger.info('BackgroundLifecycleService is READY');
    });
  }
}
