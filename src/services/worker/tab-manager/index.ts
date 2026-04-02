import { injectable, inject } from 'inversify';
import type { ITabManagerService } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';

@injectable()
export class TabManagerService implements ITabManagerService {
  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {}

  async sendToActiveRedditTab(payload: any): Promise<any> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab?.id || !tab.url?.includes('reddit.com')) {
      this.logger.error('Not on a Reddit page');
      throw new Error('请在 Reddit 页面下执行探针');
    }

    this.logger.info(`向 Tab ${tab.id} 发送指令:`, payload);
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id!, payload, (response) => {
        if (chrome.runtime.lastError) {
          this.logger.error('发送失败', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }
}
