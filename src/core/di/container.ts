import { Container } from 'inversify';
import { SERVICE_IDENTIFIER } from './identifiers';
import { Logger } from '@/common/logger';

// 导入 Common 模块的实现
import { StorageService } from '@/services/common/storage';
import type { IStorageService } from '@/services/common/storage/interface';

// 导入 Worker 模块的实现
import { TabManagerService } from '@/services/worker/tab-manager';
import type { ITabManagerService } from '@/services/worker/tab-manager/interface';

// 导入 Content 模块的实现
import { DomOverlayService } from '@/services/content/dom-overlay';
import type { IDomOverlayService } from '@/services/content/dom-overlay/interface';
import { MessageBridgeService } from '@/services/content/message-bridge';
import type { IMessageBridgeService } from '@/services/content/message-bridge/interface';

// 基础容器，注入 Common 服务
export function createBaseContainer(contextName: string): Container {
  const container = new Container();
  container.bind<Logger>(SERVICE_IDENTIFIER.Logger).toConstantValue(new Logger(contextName));
  container.bind<IStorageService>(SERVICE_IDENTIFIER.StorageService).to(StorageService).inSingletonScope();
  return container;
}

// 后台容器，叠加 Worker 服务
export function createWorkerContainer(): Container {
  const container = createBaseContainer('Background');
  container.bind<ITabManagerService>(SERVICE_IDENTIFIER.TabManager).to(TabManagerService).inSingletonScope();
  return container;
}

// 隔离脚本容器，叠加 Content 服务
export function createContentContainer(): Container {
  const container = createBaseContainer('Content');
  container.bind<IDomOverlayService>(SERVICE_IDENTIFIER.DomOverlay).to(DomOverlayService).inSingletonScope();
  container.bind<IMessageBridgeService>(SERVICE_IDENTIFIER.MessageBridge).to(MessageBridgeService).inSingletonScope();
  return container;
}

// Popup 容器
export function createPopupContainer(): Container {
  return createBaseContainer('Popup');
}
