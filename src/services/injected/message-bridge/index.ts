import { injectable, inject } from 'inversify';
import type { IInjectedMessageBridgeService } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import { PageMessageType } from '@/common/types/messages';

@injectable()
export class InjectedMessageBridgeService implements IInjectedMessageBridgeService {
  private boundMessageHandler: (event: MessageEvent) => void;

  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {
    this.boundMessageHandler = this.handleMessage.bind(this);
  }

  startListening(): void {
    this.logger.info('开始监听来自 Content Script 的消息1');
    window.addEventListener('message', this.boundMessageHandler);
  }

  stopListening(): void {
    window.removeEventListener('message', this.boundMessageHandler);
  }

  private handleMessage(event: MessageEvent): void {
    // 过滤非本窗口的闲杂消息
    if (event.source !== window) return;

    if (event.data?.type === PageMessageType.EXT_PING) {
      const payload = event.data.payload;
      this.logger.info('收到隔离世界发来的探针数据:', payload);

      // 强行挂载全局变量到主世界的 window (这是突破隔离的核心目的)
      (window as any).__MY_EXT_HACK__ = payload;
      
      this.logger.info(`已经将数据挂载到 window.__MY_EXT_HACK__! 你可以在控制台里输入 window.__MY_EXT_HACK__ 试试。`);

      // 将成功信息回复给隔离世界
      window.postMessage({ type: PageMessageType.PAGE_PONG, status: 'success' }, '*');
    }
  }
}
