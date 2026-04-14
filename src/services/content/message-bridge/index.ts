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
      let timer: ReturnType<typeof setTimeout>;

      const handler = (event: MessageEvent) => {
        // 只接收自己页面的消息
        if (event.source !== window) return;
        
        if (event.data?.type === PageMessageType.PAGE_PONG) {
          this.logger.info('收到 Main 世界的 PONG 回应！渗透成功');
          window.removeEventListener('message', handler);
          clearTimeout(timer);
          resolve(event.data.status === 'success');
        }
      };

      // 1. 监听主世界的回应
      window.addEventListener('message', handler);

      // 2. 发送消息到主世界
      window.postMessage({ type: PageMessageType.EXT_PING, payload }, '*');

      // 3. 设置超时机制，避免死等
      timer = setTimeout(() => {
        window.removeEventListener('message', handler);
        this.logger.error('渗透主世界超时，未能收到 PONG');
        resolve(false);
      }, 3000);
    });
  }

  async requestMarkdownFromMain(): Promise<{ markdown?: string | null, error?: string, debug?: any } | null> {
    this.logger.info('准备向 Main 世界请求导出 Markdown');

    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout>;

      const handler = (event: MessageEvent) => {
        if (event.source !== window) return;
        
        if (event.data?.type === PageMessageType.RES_EXPORT_MARKDOWN) {
          this.logger.info('收到 Main 世界的导出结果');
          console.log('[ContentMessageBridge] 收到 Main 世界的结果:', event.data.payload);
          window.removeEventListener('message', handler);
          clearTimeout(timer);
          resolve(event.data.payload || null);
        }
      };

      // 1. 监听主世界的回应
      window.addEventListener('message', handler);

      // 2. 发送请求到主世界
      console.log('[ContentMessageBridge] 开始向主世界发送 REQ_EXPORT_MARKDOWN 消息');
      window.postMessage({ type: PageMessageType.REQ_EXPORT_MARKDOWN }, '*');

      // 3. 设置较长的超时机制，因为解析大文档可能耗时
      timer = setTimeout(() => {
        window.removeEventListener('message', handler);
        console.error('[ContentMessageBridge] 请求导出 Markdown 超时 (10s)');
        this.logger.error('请求导出 Markdown 超时');
        resolve(null);
      }, 10000); // 10秒超时
    });
  }
}
