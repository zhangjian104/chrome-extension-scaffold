import { injectable, inject } from 'inversify';
import type { IKDocExtractorService, ExtractorResult } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import type { IKDocParserService } from '@/services/common/kdoc-parser/interface';

@injectable()
export class KDocExtractorService implements IKDocExtractorService {
  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger,
    @inject(SERVICE_IDENTIFIER.KDocParser) private parser: IKDocParserService
  ) {}

  extract(): ExtractorResult {
    this.logger.info('开始提取金山文档数据...');

    // 1. 检查页面环境
    const fileInfo = (window as any).fileInfo;
    if (!fileInfo || fileInfo.office_type !== 'o') {
      this.logger.info('当前页面不是金山智能文档，跳过提取。');
      return { error: '当前页面不是金山智能文档' };
    }

    // 2. 获取文档 AST 数据
    const originDoc = (window as any).APP?.OTL?.originDoc;
    if (!originDoc) {
      this.logger.warn('未找到 window.APP.OTL.originDoc，文档数据可能未加载完毕。');
      return { error: '未找到文档数据 (可能还在加载中)' };
    }

    // 3. 深拷贝后通过 Parser 服务解析
    try {
      const docData = JSON.parse(JSON.stringify(originDoc));
      const markdown = this.parser.parse(docData);

      if (!markdown || markdown.trim() === '') {
        return { error: '生成的 Markdown 内容为空' };
      }

      this.logger.info('解析完成，Markdown 长度:', markdown.length);
      return { markdown };
    } catch (e: any) {
      this.logger.error('解析 Markdown 失败:', e.message);
      return { error: `解析失败: ${e.message}` };
    }
  }
}
