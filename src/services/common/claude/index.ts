import { injectable } from 'inversify';
import type { IClaudeService, ClaudeRequestOptions, ClaudeResponse } from './interface';

const ENDPOINT = 'https://etai-benchmark.wps.cn/v1/messages';

@injectable()
export class ClaudeService implements IClaudeService {

  async sendMessage(options: ClaudeRequestOptions): Promise<ClaudeResponse> {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...options, stream: false }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Claude API error: ${res.status} ${res.statusText}${body ? ' - ' + body : ''}`);
    }
    return res.json();
  }

  async *streamMessage(options: ClaudeRequestOptions): AsyncGenerator<string, void, unknown> {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...options, stream: true }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Claude API error: ${res.status} ${res.statusText}${body ? ' - ' + body : ''}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 事件以 \n\n 分隔
        const parts = buffer.split('\n\n');
        // 最后一段可能不完整，留在 buffer 中
        buffer = parts.pop()!;

        for (const part of parts) {
          const text = this.extractTextFromSSE(part);
          if (text !== null) {
            yield text;
          }
          // message_stop 表示流结束
          if (part.includes('event: message_stop')) {
            return;
          }
        }
      }

      // 处理 buffer 中残留的最后一个事件
      if (buffer.trim()) {
        const text = this.extractTextFromSSE(buffer);
        if (text !== null) {
          yield text;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 从单个 SSE 事件块中提取 content_block_delta 的文本增量
   * @returns 提取到的文本片段，非 delta 事件返回 null
   */
  private extractTextFromSSE(eventBlock: string): string | null {
    if (!eventBlock.includes('event: content_block_delta')) return null;

    const dataLine = eventBlock.split('\n').find(line => line.startsWith('data: '));
    if (!dataLine) return null;

    try {
      const json = JSON.parse(dataLine.slice(6));
      return json.delta?.text ?? null;
    } catch {
      return null;
    }
  }
}

export type { IClaudeService } from './interface';
export type { ClaudeRequestOptions, ClaudeResponse, ClaudeModel, ClaudeMessage } from './interface';
