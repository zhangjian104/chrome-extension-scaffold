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

  async requestMarkdownFromMain(): Promise<{ markdown?: string | null, error?: string, debug?: any } | null> {
    this.logger.info('准备向 Main 世界请求导出 Markdown');

    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout>;

      const handler = (event: MessageEvent) => {
        if (event.source !== window) return;
        
        if (event.data?.type === PageMessageType.RES_EXPORT_MARKDOWN) {
          this.logger.info('收到 Main 世界的导出结果');
          window.removeEventListener('message', handler);
          clearTimeout(timer);
          resolve(event.data.payload || null);
        }
      };

      window.addEventListener('message', handler);
      window.postMessage({ type: PageMessageType.REQ_EXPORT_MARKDOWN }, '*');

      timer = setTimeout(() => {
        window.removeEventListener('message', handler);
        this.logger.error('请求导出 Markdown 超时');
        resolve(null);
      }, 10000);
    });
  }
}
