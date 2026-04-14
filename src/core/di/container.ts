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
import { DownloaderService } from '@/services/content/downloader';
import type { IDownloaderService } from '@/services/content/downloader/interface';

// 导入 Injected 模块的实现
import { InjectedMessageBridgeService } from '@/services/injected/message-bridge';
import type { IInjectedMessageBridgeService } from '@/services/injected/message-bridge/interface';
import { KDocExtractorService } from '@/services/injected/kdoc-extractor';
import type { IKDocExtractorService } from '@/services/injected/kdoc-extractor/interface';

// 导入 Lifecycle 模块的实现
import { BackgroundLifecycleService } from '@/services/worker/lifecycle';
import { ContentLifecycleService } from '@/services/content/lifecycle';
import { InjectedLifecycleService } from '@/services/injected/lifecycle';
import type { ILifecycleService } from '@/services/common/lifecycle/interface';

// 核心容器，仅包含无副作用/无平台限制的基础服务
export function createCoreContainer(contextName: string): Container {
  const container = new Container();
  container.bind<Logger>(SERVICE_IDENTIFIER.Logger).toConstantValue(new Logger(contextName));
  return container;
}

// 基础容器，注入 Common 服务
export function createBaseContainer(contextName: string): Container {
  const container = createCoreContainer(contextName);
  container.bind<IStorageService>(SERVICE_IDENTIFIER.StorageService).to(StorageService).inSingletonScope();
  return container;
}

// 后台容器，叠加 Worker 服务
export function createWorkerContainer(): Container {
  const container = createBaseContainer('Background');
  container.bind<ITabManagerService>(SERVICE_IDENTIFIER.TabManager).to(TabManagerService).inSingletonScope();
  container.bind<ILifecycleService>(SERVICE_IDENTIFIER.LifecycleService).to(BackgroundLifecycleService).inSingletonScope();
  return container;
}

// 隔离脚本容器，叠加 Content 服务
export function createContentContainer(): Container {
  const container = createBaseContainer('Content');
  container.bind<IDomOverlayService>(SERVICE_IDENTIFIER.DomOverlay).to(DomOverlayService).inSingletonScope();
  container.bind<IMessageBridgeService>(SERVICE_IDENTIFIER.MessageBridge).to(MessageBridgeService).inSingletonScope();
  container.bind<IDownloaderService>(SERVICE_IDENTIFIER.Downloader).to(DownloaderService).inSingletonScope();
  container.bind<ILifecycleService>(SERVICE_IDENTIFIER.LifecycleService).to(ContentLifecycleService).inSingletonScope();
  return container;
}

// Popup 容器
export function createPopupContainer(): Container {
  return createBaseContainer('Popup');
}

// Injected (主世界) 容器
export function createInjectedContainer(): Container {
  const container = createCoreContainer('Injected');
  container.bind<IInjectedMessageBridgeService>(SERVICE_IDENTIFIER.InjectedMessageBridge).to(InjectedMessageBridgeService).inSingletonScope();
  container.bind<IKDocExtractorService>(SERVICE_IDENTIFIER.KDocExtractor).to(KDocExtractorService).inSingletonScope();
  container.bind<ILifecycleService>(SERVICE_IDENTIFIER.LifecycleService).to(InjectedLifecycleService).inSingletonScope();
  return container;
}
