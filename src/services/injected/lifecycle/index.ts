import { injectable, inject } from 'inversify';
import { BaseLifecycleService } from '@/services/common/lifecycle/base';
import { EntityType, LifecycleState } from '@/common/types/lifecycle';
import { PageMessageType } from '@/common/types/messages';
import { Logger } from '@/common/logger';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';

@injectable()
export class InjectedLifecycleService extends BaseLifecycleService {
  readonly entityType = EntityType.INJECTED_SCRIPT;

  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {
    super();
    this.initListeners();
  }

  private initListeners() {
    // 监听自身的 READY 状态，并通知 Content Script
    this.onState(LifecycleState.READY, () => {
      this.logger.info('InjectedLifecycleService is READY, notifying Content Script...');
      
      // 向 Content Script 的 Isolated World 广播自己已就绪
      window.postMessage({ 
        type: PageMessageType.LIFECYCLE_INJECTED_READY, 
        action: 'INJECTED_READY', 
        payload: { time: Date.now() } 
      }, '*');
    });
  }
}
