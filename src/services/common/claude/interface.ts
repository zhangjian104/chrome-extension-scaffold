export type ClaudeModel =
  | 'claude-3-5-haiku' | 'claude-3-5-sonnet'
  | 'claude-3-haiku'   | 'claude-3-sonnet'
  | 'claude-opus-4-5'  | 'claude-opus-4-6-v1'
  | 'claude-sonnet-4'  | 'claude-sonnet-4-5';

export interface ClaudeTextContent {
  type: 'text';
  text: string;
}

export interface ClaudeImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
    data: string;
  };
}

export type ClaudeContentBlock = ClaudeTextContent | ClaudeImageContent;

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

export interface ClaudeRequestOptions {
  model: ClaudeModel;
  messages: ClaudeMessage[];
  max_tokens: number;
  system?: string | any[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  stop_sequences?: string[];
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

export interface IClaudeService {
  /** 非流式调用，一次性返回完整响应 */
  sendMessage(options: ClaudeRequestOptions): Promise<ClaudeResponse>;

  /**
   * 流式调用，返回 AsyncGenerator 逐块 yield 文本片段
   * 消费方式: for await (const chunk of service.streamMessage(opts)) { ... }
   */
  streamMessage(options: ClaudeRequestOptions): AsyncGenerator<string, void, unknown>;
}
