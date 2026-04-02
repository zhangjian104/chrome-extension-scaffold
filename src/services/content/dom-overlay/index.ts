import { injectable, inject } from 'inversify';
import type { IDomOverlayService } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';

@injectable()
export class DomOverlayService implements IDomOverlayService {
  private container: HTMLElement | null = null;

  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {}

  showStatus(message: string, isSuccess: boolean = false): void {
    if (!this.container) {
      this.container = document.createElement('div');
      Object.assign(this.container.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        zIndex: '999999',
        borderRadius: '8px',
        color: '#ffffff',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease',
        fontFamily: 'sans-serif'
      });
      // 附加到 DOM
      document.documentElement.appendChild(this.container);
      this.logger.info('DOM Overlay 已注入到页面中');
    }

    this.container.style.backgroundColor = isSuccess ? '#10b981' : '#f59e0b';
    this.container.innerText = message;
    this.logger.info(`Overlay 状态更新: ${message}`);
  }
}
