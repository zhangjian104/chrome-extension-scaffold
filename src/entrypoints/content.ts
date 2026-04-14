import 'reflect-metadata';
import { createContentContainer } from '@/core/di/container';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import type { IDomOverlayService } from '@/services/content/dom-overlay/interface';
import type { IMessageBridgeService } from '@/services/content/message-bridge/interface';
import type { ILifecycleService } from '@/services/common/lifecycle/interface';
import { ExtensionAction } from '@/common/types/messages';
import type { ExtensionMessage } from '@/common/types/messages';
import { LifecycleState } from '@/common/types/lifecycle';

import type { IDownloaderService } from '@/services/content/downloader/interface';

export default defineContentScript({
  matches: ['*://*.reddit.com/*', '*://*.kdocs.cn/*'],
  main() {
    // 1. 实例化 Content 隔离容器
    const container = createContentContainer();
    const logger = container.get<Logger>(SERVICE_IDENTIFIER.Logger);
    const domOverlay = container.get<IDomOverlayService>(SERVICE_IDENTIFIER.DomOverlay);
    const messageBridge = container.get<IMessageBridgeService>(SERVICE_IDENTIFIER.MessageBridge);
    const downloader = container.get<IDownloaderService>(SERVICE_IDENTIFIER.Downloader);
    const lifecycle = container.get<ILifecycleService>(SERVICE_IDENTIFIER.LifecycleService);

    lifecycle.setState(LifecycleState.INITIALIZING);

    logger.info('Content Script 已挂载。等待 Background 指令...');

    // 2. 监听 Background 发来的消息
    chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
      if (request.action === ExtensionAction.HACK_CONTENT) {
        logger.info('收到 Background 转发的探针执行要求', request.payload);
        
        (async () => {
          try {
            // 确保 Inject Script 已经挂载就绪 (等待注入的脚本完成初始化)
            if (lifecycle.getChildState?.('injected') !== LifecycleState.READY) {
              logger.info('等待 Inject Script 就绪...');
              domOverlay.showStatus('等待探针主世界挂载...', false);
              await lifecycle.waitUntilChild?.('injected', LifecycleState.READY);
            }

            // UI 操作：打点
            domOverlay.showStatus('探针已到达隔离世界，正在向主世界渗透...', false);

            // 主世界通信操作
            const success = await messageBridge.pingToMain(request.payload);

            if (success) {
              domOverlay.showStatus('✅ 主世界渗透成功！变量已挂载', true);
            } else {
              domOverlay.showStatus('❌ 渗透超时或失败', false);
            }
            
            // 将结果告诉 Background
            sendResponse(success);
          } catch (e: any) {
            domOverlay.showStatus(`❌ 发生错误: ${e.message}`, false);
            sendResponse(false);
          }
        })();

        return true;
      }

      if (request.action === ExtensionAction.EXPORT_MARKDOWN) {
        logger.info('收到 Background 转发的导出 Markdown 指令');
        
        (async () => {
          try {
            // 确保 Inject Script 已经挂载就绪
            if (lifecycle.getChildState?.('injected') !== LifecycleState.READY) {
              logger.info('等待 Inject Script 就绪...');
              await lifecycle.waitUntilChild?.('injected', LifecycleState.READY);
            }

            logger.info('向主世界请求 Markdown 数据...');
            const result = await messageBridge.requestMarkdownFromMain();

            if (result && result.markdown) {
              logger.info('成功获取 Markdown 数据，准备下载...');
              // 获取文档标题作为文件名，默认使用 "kdoc-export"
              const title = document.title || 'kdoc-export';
              downloader.downloadStringAsFile(result.markdown, `${title}.md`);
              sendResponse(true);
            } else if (result && result.error) {
              logger.warn(`获取 Markdown 数据被拒绝: ${result.error}`);
              console.warn('[Content] 主世界返回失败原因:', result.error, '调试信息:', result.debug);
              // 可以通过抛出错误，让 UI 收到更明确的信息
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

    // 监听 Inject Script 就绪事件，仅做日志记录
    lifecycle.onState(LifecycleState.REGISTERED, () => {
      logger.info('Content Script 已注册完毕，准备完毕');
    });

    lifecycle.setState(LifecycleState.REGISTERED);

    // 所有准备工作完毕，切换为 READY，此时 Lifecycle 内部会自动向 Background 发送握手消息
    lifecycle.setState(LifecycleState.READY);
  },
});
