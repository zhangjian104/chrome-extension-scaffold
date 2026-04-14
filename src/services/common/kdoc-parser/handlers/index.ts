import { BaseHandler } from './BaseHandler';
import { BlockContainerHandler } from './BlockHandlers';
import { TextHandler, ParagraphHandler, HeadingHandler, HardBreakHandler } from './TextHandlers';
import { CodeBlockHandler, PictureHandler, LinkViewHandler, EmojiHandler } from './MediaHandlers';
import { CircleObjectHandler, SubDocHandler } from './AdvancedHandlers';
import { TableHandler, TableRowHandler, TableCellHandler } from './TableHandlers';

// 透传容器
export const blockContainerHandler = new BlockContainerHandler();

export const handlers: Record<string, BaseHandler> = {
  'doc': blockContainerHandler,
  'logic_block': blockContainerHandler,
  'block_tile': blockContainerHandler,
  'image_column_container': blockContainerHandler,
  'image_column': blockContainerHandler,
  'sub_doc_object': blockContainerHandler,
  'sub_doc_layout_object': blockContainerHandler,
  'sub_doc_tile': blockContainerHandler,
  'native_inline_container': blockContainerHandler,

  'paragraph': new ParagraphHandler(),
  'heading': new HeadingHandler(),
  'text': new TextHandler(),
  'hard_break': new HardBreakHandler(),
  'outline-title': new HeadingHandler(),
  'outline-title-2': new HeadingHandler(),
  'outline-title-3': new HeadingHandler(),
  'outline-title-4': new HeadingHandler(),
  'outline-title-5': new HeadingHandler(),
  'outline-title-6': new HeadingHandler(),

  'code_block': new CodeBlockHandler(),
  'picture': new PictureHandler(),
  'link_view': new LinkViewHandler(),
  'emoji': new EmojiHandler(),

  'circle_object': new CircleObjectHandler(),
  'sub_doc': new SubDocHandler(),
  'blockquote': new SubDocHandler(),

  // Table 处理器
  'outline-table': new TableHandler(),
  'outline-table-row': new TableRowHandler(),
  'outline-table-cell': new TableCellHandler()
};
