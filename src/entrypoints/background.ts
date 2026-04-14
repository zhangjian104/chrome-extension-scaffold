import 'reflect-metadata';
import { createWorkerContainer } from '@/core/di/container';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import type { ILifecycleService } from '@/services/common/lifecycle/interface';
import { LifecycleState } from '@/common/types/lifecycle';

export default defineBackground(() => {
  const container = createWorkerContainer();
  const logger = container.get<Logger>(SERVICE_IDENTIFIER.Logger);
  const lifecycle = container.get<ILifecycleService>(SERVICE_IDENTIFIER.LifecycleService);

  lifecycle.setState(LifecycleState.INITIALIZING);

  logger.info('Background Service Worker initialized.', { id: browser.runtime.id });

  lifecycle.setState(LifecycleState.READY);
});
