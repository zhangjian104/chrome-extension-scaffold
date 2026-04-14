import { injectable, inject } from 'inversify';
import type { IKDocExtractorService, ExtractorResult } from './interface';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';
import { KDocParser } from '@/services/common/kdoc-parser';

@injectable()
export class KDocExtractorService implements IKDocExtractorService {
  constructor(
    @inject(SERVICE_IDENTIFIER.Logger) private logger: Logger
  ) {}

  extract(): ExtractorResult {
    debugger;
    this.logger.info('开始检查当前页面环境并提取金山文档数据...');
    this.logger.info('[KDocExtractor] 开始执行 extract...');

    // 1. 检查环境
    const fileInfo = (window as any).fileInfo;
    if (!fileInfo) {
      this.logger.warn('[KDocExtractor] window.fileInfo 不存在！');
      this.logger.info('当前页面不是金山智能文档 (office_type !== "o")，跳过提取。');
      return { error: 'window.fileInfo 不存在', debug: 'NOT_KDOC' };
    }
    
    if (fileInfo.office_type !== 'o') {
      this.logger.warn('[KDocExtractor] fileInfo.office_type !== "o"，当前类型：', fileInfo.office_type);
      this.logger.info('当前页面不是金山智能文档 (office_type !== "o")，跳过提取。');
      return { error: `不支持的文件类型: ${fileInfo.office_type}`, debug: 'UNSUPPORTED_TYPE' };
    }

    // 2. 获取文档树数据
    const originDoc = (window as any).APP?.OTL?.originDoc;
    this.logger.info('========== STEP 2: [KDocExtractor] 主世界取到了 window.APP.OTL.originDoc ==========\n', originDoc);
    
    if (!originDoc) {
      this.logger.warn('[KDocExtractor] 未找到 window.APP.OTL.originDoc。检查 window.APP 是否存在:', !!(window as any).APP);
      this.logger.warn('未找到 window.APP.OTL.originDoc，文档数据可能未加载完毕或结构已变更。');
      return { error: '未找到文档数据 (可能还在加载中，或格式不兼容)', debug: 'NO_ORIGIN_DOC' };
    }

    this.logger.info('成功获取 originDoc 数据，开始解析转换为 Markdown...');
    this.logger.info('[KDocExtractor] 成功获取 originDoc，准备执行解析');

    // 3. 执行解析
    try {
      let docData = JSON.parse(JSON.stringify(originDoc));
      let parseSource = 'object';
      

      const parser = new KDocParser(docData);
      const markdown = parser.parse(docData);
      
      this.logger.info('解析完成，成功生成 Markdown 文本。');
      this.logger.info('[KDocExtractor] 解析成功！生成的 MD 长度:', markdown?.length);

      if (!markdown || markdown.trim() === '') {
        return { 
          error: '生成的 Markdown 内容为空', 
          debug: { 
            parseSource,
            typeofDocData: typeof docData, 
            keys: docData ? Object.keys(docData) : [],
            hasType: docData?.type,
            hasContent: !!docData?.content
          } 
        };
      }

      return { markdown };
    } catch (e: any) {
      this.logger.error('[KDocExtractor] 解析 Markdown 时抛出异常:', e);
      this.logger.error('解析 Markdown 失败:', e.message);
      return { error: `解析失败: ${e.message}`, debug: e.stack };
    }
  }
}
