import { injectable, inject } from 'inversify';
import { BaseLifecycleService } from '@/services/common/lifecycle/base';
import { EntityType, LifecycleState } from '@/common/types/lifecycle';
import { PageMessageType, ExtensionAction } from '@/common/types/messages';
import { Logger } from '@/common/logger';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';

@injectable()
export class ContentLifecycleService extends BaseLifecycleService {
  readonly entityType = EntityType.CONTENT_SCRIPT;

  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {
    super();
    this.initListeners();
  }

  private initListeners() {
    // 监听自身的 READY 状态，并通知 Background
    this.onState(LifecycleState.READY, () => {
      this.logger.info('ContentLifecycleService is READY, notifying background...');
      chrome.runtime.sendMessage({
        action: ExtensionAction.LIFECYCLE_CONTENT_READY
      }).catch(e => {
        this.logger.error('Failed to notify background:', e);
      });
    });

    // 监听来自 Inject Script 的消息
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;

      if (event.data?.type === PageMessageType.LIFECYCLE_INJECTED_READY) {
        this.logger.info('Inject Script 已就绪');
        // 可以将 Inject Script 看作当前 Content Script 的一个固定子实体 (例如 id 为 'injected')
        this.setChildState('injected', LifecycleState.READY);
      }
    });
  }
}
