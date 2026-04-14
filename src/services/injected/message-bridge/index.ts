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
    this.logger.info('开始监听来自 Content Script 的消息');
    window.addEventListener('message', this.boundMessageHandler);
  }

  stopListening(): void {
    window.removeEventListener('message', this.boundMessageHandler);
  }

  private handleMessage(event: MessageEvent): void {
    if (event.source !== window) return;

    if (event.data?.type === PageMessageType.REQ_CHECK_PAGE) {
      const fileInfo = (window as any).fileInfo;
      let status: 'supported' | 'unsupported' | 'pending';
      if (!fileInfo || fileInfo.office_type === undefined) {
        status = 'pending';
      } else if (fileInfo.office_type === 'o') {
        status = 'supported';
      } else {
        status = 'unsupported';
      }
      window.postMessage({
        type: PageMessageType.RES_CHECK_PAGE,
        payload: { status }
      }, '*');
      return;
    }

    if (event.data?.type === PageMessageType.REQ_EXPORT_MARKDOWN) {
      this.logger.info('收到导出 Markdown 请求');
      const result = this.kdocExtractor.extract();

      try {
        window.postMessage({ 
          type: PageMessageType.RES_EXPORT_MARKDOWN, 
          payload: { 
            markdown: result.markdown,
            error: result.error,
            debug: result.debug ? String(result.debug) : undefined
          } 
        }, '*');
      } catch (postError) {
        this.logger.error('postMessage 失败 (可能包含不可克隆的属性):', postError);
        window.postMessage({ 
          type: PageMessageType.RES_EXPORT_MARKDOWN, 
          payload: { error: '结果返回失败，包含无法传输的属性 (DataCloneError)' } 
        }, '*');
      }
    }
  }
}
