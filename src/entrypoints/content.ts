import 'reflect-metadata';
import { createContentContainer } from '@/core/di/container';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import type { IDomOverlayService } from '@/services/content/dom-overlay/interface';
import type { IMessageBridgeService } from '@/services/content/message-bridge/interface';
import { ExtensionAction } from '@/common/types/messages';
import type { ExtensionMessage } from '@/common/types/messages';

export default defineContentScript({
  matches: ['*://*.reddit.com/*'],
  main() {
    // 1. 实例化 Content 隔离容器
    const container = createContentContainer();
    const logger = container.get<Logger>(SERVICE_IDENTIFIER.Logger);
    const domOverlay = container.get<IDomOverlayService>(SERVICE_IDENTIFIER.DomOverlay);
    const messageBridge = container.get<IMessageBridgeService>(SERVICE_IDENTIFIER.MessageBridge);

    logger.info('Content Script 已挂载。等待 Background 指令...');

    // 2. 监听 Background 发来的消息
    chrome.runtime.onMessage.addListener((request: ExtensionMessage, sender, sendResponse) => {
      if (request.action === ExtensionAction.HACK_CONTENT) {
        logger.info('收到 Background 转发的探针执行要求', request.payload);
        
        (async () => {
          try {
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
    });
  },
});
