import { injectable, inject } from 'inversify';
import type { IMessageBridgeService } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import { PageMessageType } from '@/common/types/messages';

@injectable()
export class MessageBridgeService implements IMessageBridgeService {
  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {}

  async pingToMain(payload: string): Promise<boolean> {
    this.logger.info(`准备向 Main 世界发送 payload: ${payload}`);

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        // 只接收自己页面的消息
        if (event.source !== window) return;
        
        if (event.data?.type === PageMessageType.PAGE_PONG) {
          this.logger.info('收到 Main 世界的 PONG 回应！渗透成功');
          window.removeEventListener('message', handler);
          resolve(event.data.status === 'success');
        }
      };

      // 1. 监听主世界的回应
      window.addEventListener('message', handler);

      // 2. 发送消息到主世界
      window.postMessage({ type: PageMessageType.EXT_PING, payload }, '*');

      // 3. 设置超时机制，避免死等
      setTimeout(() => {
        window.removeEventListener('message', handler);
        this.logger.error('渗透主世界超时，未能收到 PONG');
        resolve(false);
      }, 3000);
    });
  }
}
