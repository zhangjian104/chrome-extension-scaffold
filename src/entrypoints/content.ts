import 'reflect-metadata';
import { createContentContainer } from '@/core/di/container';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import type { IMessageBridgeService } from '@/services/content/message-bridge/interface';
import type { ILifecycleService } from '@/services/common/lifecycle/interface';
import { ExtensionAction } from '@/common/types/messages';
import type { ExtensionMessage } from '@/common/types/messages';
import { LifecycleState } from '@/common/types/lifecycle';
import type { IDownloaderService } from '@/services/content/downloader/interface';

export default defineContentScript({
  matches: ['*://*.kdocs.cn/*'],
  main() {
    const container = createContentContainer();
    const logger = container.get<Logger>(SERVICE_IDENTIFIER.Logger);
    const messageBridge = container.get<IMessageBridgeService>(SERVICE_IDENTIFIER.MessageBridge);
    const downloader = container.get<IDownloaderService>(SERVICE_IDENTIFIER.Downloader);
    const lifecycle = container.get<ILifecycleService>(SERVICE_IDENTIFIER.LifecycleService);

    lifecycle.setState(LifecycleState.INITIALIZING);

    logger.info('Content Script 已挂载。等待指令...');

    chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
      if (request.action === ExtensionAction.EXPORT_MARKDOWN) {
        logger.info('收到导出 Markdown 指令');
        
        (async () => {
          try {
            if (lifecycle.getChildState?.('injected') !== LifecycleState.READY) {
              logger.info('等待 Inject Script 就绪...');
              await lifecycle.waitUntilChild?.('injected', LifecycleState.READY);
            }

            logger.info('向主世界请求 Markdown 数据...');
            const result = await messageBridge.requestMarkdownFromMain();

            if (result && result.markdown) {
              logger.info('成功获取 Markdown 数据，准备下载...');
              const title = document.title || 'kdoc-export';
              downloader.downloadStringAsFile(result.markdown, `${title}.md`);
              sendResponse(true);
            } else if (result && result.error) {
              logger.warn(`获取 Markdown 数据被拒绝: ${result.error}`);
              throw new Error(result.error);
            } else {
              logger.warn('获取 Markdown 数据失败，可能当前页面不是金山文档或文档未加载');
              sendResponse(false);
            }
          } catch (e: any) {
            logger.error(`导出 Markdown 时发生错误: ${e.message}`);
            sendResponse(false);
          }
        })();

        return true;
      }
    });

    lifecycle.onState(LifecycleState.REGISTERED, () => {
      logger.info('Content Script 已注册完毕，准备完毕');
    });

    lifecycle.setState(LifecycleState.REGISTERED);
    lifecycle.setState(LifecycleState.READY);
  },
});
