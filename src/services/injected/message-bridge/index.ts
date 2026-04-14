import { injectable, inject } from 'inversify';
import type { IInjectedMessageBridgeService } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import { PageMessageType } from '@/common/types/messages';
import type { IKDocExtractorService } from '../kdoc-extractor/interface';

@injectable()
export class InjectedMessageBridgeService implements IInjectedMessageBridgeService {
  private boundMessageHandler: (event: MessageEvent) => void;

  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger,
    @inject(SERVICE_IDENTIFIER.KDocExtractor) private kdocExtractor: IKDocExtractorService
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

    if (event.data?.type === PageMessageType.REQ_EXPORT_MARKDOWN) {
      debugger;
      this.logger.info('========== STEP 1: [InjectedMessageBridge] 主世界收到了导出命令 ==========');
      this.logger.info('收到导出 Markdown 请求');
      const result = this.kdocExtractor.extract();
      
      this.logger.info('========== STEP 3: [InjectedMessageBridge] Parser 之后的 markdown 字符串 ==========\n', result.markdown);
      // 返回结果给隔离世界
      try {
        window.postMessage({ 
          type: PageMessageType.RES_EXPORT_MARKDOWN, 
          // 确保 payload 是一个纯净的、可被克隆的普通对象
          payload: { 
            markdown: result.markdown,
            error: result.error,
            // debug 里面可能包含复杂的原型链或函数，这里直接抛弃或者转成字符串
            debug: result.debug ? String(result.debug) : undefined
          } 
        }, '*');
      } catch (postError) {
        this.logger.error('[InjectedMessageBridge] postMessage 失败 (可能是有不可克隆的属性):', postError);
        window.postMessage({ 
          type: PageMessageType.RES_EXPORT_MARKDOWN, 
          payload: { 
            error: '结果返回失败，包含无法传输的属性 (DataCloneError)'
          } 
        }, '*');
      }
    } else if (event.data?.type === PageMessageType.EXT_PING) {
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
