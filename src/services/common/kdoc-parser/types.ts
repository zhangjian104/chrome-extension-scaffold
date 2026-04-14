export interface KDocNode {
  type: string;
  attrs?: Record<string, any>;
  content?: KDocNode[];
  text?: string;
  marks?: TextMark[];
}

export interface TextMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface ParserContext {
  listDatas: Record<string, any>;
  listStateTracker: any;
  isInsideQuote?: boolean;
  isInsideTable?: boolean; // 新增用于在嵌套中标识当前正处于单元格内
}
