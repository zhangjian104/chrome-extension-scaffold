import { injectable, inject } from 'inversify';
import type { IStorageService } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';

@injectable()
export class StorageService implements IStorageService {
  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    this.logger.info(`Getting key: ${key}`);
    const data = await chrome.storage.local.get(key);
    return (data[key] as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.logger.info(`Setting key: ${key}`);
    await chrome.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    this.logger.info(`Removing key: ${key}`);
    await chrome.storage.local.remove(key);
  }
}
