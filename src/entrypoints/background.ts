import 'reflect-metadata';
import { createWorkerContainer } from '@/core/di/container';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import type { IStorageService } from '@/services/common/storage/interface';
import type { ITabManagerService } from '@/services/worker/tab-manager/interface';
import { ExtensionAction } from '@/common/types/messages';
import type { ExtensionMessage } from '@/common/types/messages';

export default defineBackground(() => {
  // 1. 初始化属于 Background 环境的 IoC 容器
  const container = createWorkerContainer();
  const logger = container.get<Logger>(SERVICE_IDENTIFIER.Logger);
  const storageService = container.get<IStorageService>(SERVICE_IDENTIFIER.StorageService);
  const tabManager = container.get<ITabManagerService>(SERVICE_IDENTIFIER.TabManager);

  logger.info('Background Service Worker initialized.', { id: browser.runtime.id });

  // 2. 监听来自 Popup 的请求
  chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
    if (request.action === ExtensionAction.HACK_INIT) {
      logger.info('收到 Popup 探针指令:', request.payload);
      
      // 必须用立即执行函数包裹异步流
      (async () => {
        try {
          // 持久化存储 (模拟 Common 联动)
          await storageService.set('last_hack_payload', request.payload);
          
          // 转发指令给 Content Script
          const result = await tabManager.sendToActiveRedditTab({
            action: ExtensionAction.HACK_CONTENT,
            payload: request.payload
          });
          
          logger.info('收到 Content Script 执行结果', result);
          sendResponse({ success: true, result });
        } catch (e: any) {
          logger.error('链路执行失败:', e.message);
          sendResponse({ success: false, error: e.message });
        }
      })();
      
      // 返回 true 告诉 Chrome 我们会异步 sendResponse
      return true;
    }
  });
});
