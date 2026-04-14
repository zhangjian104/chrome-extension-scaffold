import 'reflect-metadata';
import { createInjectedContainer } from '@/core/di/container';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import type { IInjectedMessageBridgeService } from '@/services/injected/message-bridge/interface';
import type { ILifecycleService } from '@/services/common/lifecycle/interface';
import { LifecycleState } from '@/common/types/lifecycle';

export default defineContentScript({
  matches: ['*://*.kdocs.cn/*'],
  world: 'MAIN',
  main() {
    // 1. 实例化 Injected (主世界) 隔离容器
    const container = createInjectedContainer();
    const logger = container.get<Logger>(SERVICE_IDENTIFIER.Logger);
    const messageBridge = container.get<IInjectedMessageBridgeService>(SERVICE_IDENTIFIER.InjectedMessageBridge);
    const lifecycle = container.get<ILifecycleService>(SERVICE_IDENTIFIER.LifecycleService);

    lifecycle.setState(LifecycleState.INITIALIZING);
    logger.info('Main world script initializing...');

    // 2. 启动消息桥接监听
    messageBridge.startListening();

    lifecycle.setState(LifecycleState.REGISTERED);

    // 3. 所有准备工作完毕，切换为 READY
    // 此时 InjectedLifecycleService 内部会自动向 Content Script 广播自己已就绪
    lifecycle.setState(LifecycleState.READY);
  },
});
