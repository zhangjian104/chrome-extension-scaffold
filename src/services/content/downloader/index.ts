import { injectable, inject } from 'inversify';
import type { IDownloaderService } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';

@injectable()
export class DownloaderService implements IDownloaderService {
  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {}

  downloadStringAsFile(content: string, filename: string): void {
    this.logger.info(`准备下载文件: ${filename}`);
    
    try {
      // 1. 创建 Blob 对象
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      
      // 2. 生成隐式 URL
      const url = URL.createObjectURL(blob);
      
      // 3. 创建隐藏的 <a> 标签
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // 4. 模拟点击触发下载
      document.body.appendChild(link);
      link.click();
      
      // 5. 清理 DOM 和释放 URL
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.logger.info(`文件下载触发成功: ${filename}`);
    } catch (e: any) {
      this.logger.error(`文件下载失败: ${e.message}`);
    }
  }
}
