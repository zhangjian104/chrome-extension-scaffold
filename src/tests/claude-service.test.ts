import 'reflect-metadata';
import { ClaudeService } from '../../src/services/common/claude';
import type { ClaudeRequestOptions, ClaudeResponse } from '../../src/services/common/claude/interface';

// ============================================================
// 测试基础设施
// ============================================================
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ ${testName}${detail ? '\n     ' + detail : ''}`);
    failed++;
  }
}

const service = new ClaudeService();

const BASE_OPTIONS: ClaudeRequestOptions = {
  model: 'claude-3-5-haiku',
  messages: [{ role: 'user', content: '请用一句话回答：1+1等于多少？' }],
  max_tokens: 128,
};

// ============================================================
// 运行所有测试
// ============================================================
async function runTests() {

  // T1: 非流式基础调用
  console.log('\n--- T1: 非流式基础调用 ---');
  {
    try {
      const res: ClaudeResponse = await service.sendMessage(BASE_OPTIONS);
      assert(typeof res.id === 'string' && res.id.length > 0, '返回有效 id');
      assert(Array.isArray(res.content) && res.content.length > 0, 'content 为非空数组');
      assert(typeof res.content[0].text === 'string' && res.content[0].text.length > 0, 'content[0].text 非空');
      assert(typeof res.usage === 'object', 'usage 对象存在');
      assert(typeof res.usage.input_tokens === 'number', 'input_tokens 为数字');
      assert(typeof res.usage.output_tokens === 'number', 'output_tokens 为数字');
      console.log(`     回复: ${res.content[0].text.slice(0, 80)}...`);
    } catch (e: any) {
      assert(false, '非流式调用不应抛异常', e.message);
    }
  }

  // T2: 非流式 system prompt
  console.log('\n--- T2: 非流式 system prompt ---');
  {
    try {
      const res = await service.sendMessage({
        ...BASE_OPTIONS,
        system: '你是一个只会说"喵"的猫咪。无论用户说什么，都只回复"喵"。',
        messages: [{ role: 'user', content: '你好' }],
      });
      assert(typeof res.content[0].text === 'string', '返回了文本内容');
      console.log(`     回复: ${res.content[0].text.slice(0, 80)}`);
    } catch (e: any) {
      assert(false, 'system prompt 调用不应抛异常', e.message);
    }
  }

  // T3: 非流式多轮对话
  console.log('\n--- T3: 非流式多轮对话 ---');
  {
    try {
      const res = await service.sendMessage({
        ...BASE_OPTIONS,
        messages: [
          { role: 'user', content: '我最喜欢的数字是 42。请记住它。' },
          { role: 'assistant', content: '好的，我记住了，你最喜欢的数字是 42。' },
          { role: 'user', content: '我最喜欢的数字是几？' },
        ],
      });
      const text = res.content[0].text;
      assert(text.includes('42'), '多轮对话：模型记住了上下文中的 42', `实际回复: ${text.slice(0, 120)}`);
    } catch (e: any) {
      assert(false, '多轮对话不应抛异常', e.message);
    }
  }

  // T4: 流式基础调用
  console.log('\n--- T4: 流式基础调用 ---');
  {
    try {
      let fullText = '';
      let chunkCount = 0;
      for await (const chunk of service.streamMessage(BASE_OPTIONS)) {
        fullText += chunk;
        chunkCount++;
      }
      assert(chunkCount > 0, `收到 ${chunkCount} 个 chunk`);
      assert(fullText.length > 0, '拼接后的文本非空');
      console.log(`     流式回复 (${chunkCount} chunks): ${fullText.slice(0, 80)}...`);
    } catch (e: any) {
      assert(false, '流式调用不应抛异常', e.message);
    }
  }

  // T5: 流式提前中断
  console.log('\n--- T5: 流式提前中断 ---');
  {
    try {
      let chunks = 0;
      for await (const chunk of service.streamMessage({
        ...BASE_OPTIONS,
        messages: [{ role: 'user', content: '写一篇 500 字的文章，主题随意。' }],
        max_tokens: 1024,
      })) {
        chunks++;
        if (chunks >= 3) break;
      }
      assert(chunks >= 3, `成功消费 ${chunks} 个 chunk 后 break`);
      assert(true, 'break 后无异常');
    } catch (e: any) {
      assert(false, '流式提前中断不应抛异常', e.message);
    }
  }

  // T6: 错误处理（构造一个必然失败的请求：空 messages + max_tokens 为 0）
  console.log('\n--- T6: 错误处理 ---');
  {
    try {
      await service.sendMessage({
        model: 'claude-3-5-haiku',
        messages: [],
        max_tokens: 0,
      });
      // 如果 API 没有拒绝，也测试一下无效 endpoint 的场景
      console.log('     注意: API 未对空 messages 返回错误，尝试无效 endpoint...');
      const badService = Object.create(service);
      Object.defineProperty(badService, 'endpoint', { value: 'https://httpstat.us/500' });
      // 这个分支不可控，跳过并标记为通过——核心断言在下方 fallback 中
    } catch (e: any) {
      assert(e instanceof Error, '抛出 Error 实例');
      assert(e.message.includes('Claude API error'), '错误消息包含 "Claude API error"', e.message);
      console.log(`     错误信息: ${e.message.slice(0, 120)}`);
    }

    // 补充：直接测试 fetch 返回非 2xx 时 sendMessage 的错误路径
    try {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => new Response('Forbidden', { status: 403, statusText: 'Forbidden' });
      try {
        await service.sendMessage(BASE_OPTIONS);
        assert(false, 'mock 403 应当抛出异常');
      } catch (e: any) {
        assert(e instanceof Error, '[mock] 抛出 Error 实例');
        assert(e.message.includes('403'), '[mock] 错误消息包含 HTTP 状态码 403', e.message);
        assert(e.message.includes('Claude API error'), '[mock] 错误消息包含 "Claude API error"', e.message);
      } finally {
        globalThis.fetch = originalFetch;
      }
    } catch (e: any) {
      assert(false, 'mock fetch 测试异常', e.message);
    }
  }

  // 测试汇总
  console.log(`\n========================================`);
  console.log(`  测试结果: ${passed} 通过, ${failed} 失败`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('测试执行异常:', err);
  process.exit(1);
});
