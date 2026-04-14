import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { KDocParserService } from '../../src/services/common/kdoc-parser';

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

function readFixture(filename: string): string {
  return fs.readFileSync(path.resolve(__dirname, '..', filename), 'utf-8');
}

// ============================================================
// 初始化 Parser 服务（无 DI 容器也可直接实例化，因为无构造参数依赖）
// ============================================================
const parser = new KDocParserService();

// ============================================================
// T1: 基础文档解析 (ap1.json)
// ============================================================
console.log('\n--- T1: 基础文档解析 (ap1.json) ---');
{
  const inputPath = path.resolve(__dirname, '..', 'ap1.json');
  if (fs.existsSync(inputPath)) {
    const docJson = JSON.parse(readFixture('ap1.json'));
    const result = parser.parse(docJson);
    const expected = readFixture('ap1_output.md');
    assert(result === expected, '输出与 ap1_output.md 一致', 
      result !== expected ? `输出长度 ${result.length} vs 预期长度 ${expected.length}` : undefined);
    
    // 同时写入新文件供人工对比
    fs.writeFileSync(path.resolve(__dirname, '..', 'ap1_output_new.md'), result, 'utf-8');
  } else {
    assert(false, '跳过：ap1.json 文件不存在');
  }
}

// ============================================================
// T2: 复杂文档解析 (ap2.json)
// ============================================================
console.log('\n--- T2: 复杂文档解析 (ap2.json) ---');
{
  const inputPath = path.resolve(__dirname, '..', 'ap2.json');
  if (fs.existsSync(inputPath)) {
    const docJson = JSON.parse(readFixture('ap2.json'));
    const result = parser.parse(docJson);
    const expected = readFixture('ap2_output.md');
    assert(result === expected, '输出与 ap2_output.md 一致',
      result !== expected ? `输出长度 ${result.length} vs 预期长度 ${expected.length}` : undefined);

    fs.writeFileSync(path.resolve(__dirname, '..', 'ap2_output_new.md'), result, 'utf-8');
  } else {
    assert(false, '跳过：ap2.json 文件不存在');
  }
}

// ============================================================
// T3: 空文档
// ============================================================
console.log('\n--- T3: 空文档 ---');
{
  const result = parser.parse({ type: 'doc' });
  assert(result === '', '空文档返回空字符串', `实际返回: "${result}"`);
}

// ============================================================
// T4: 纯段落文本
// ============================================================
console.log('\n--- T4: 纯段落文本 ---');
{
  const doc = {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: 'Hello World' }]
    }]
  };
  const result = parser.parse(doc);
  assert(result.includes('Hello World'), '包含段落文本');
  assert(!result.includes('#'), '不包含标题标记');
}

// ============================================================
// T5: 标题层级 (outline-title 到 outline-title-6)
// ============================================================
console.log('\n--- T5: 标题层级 ---');
{
  const doc = {
    type: 'doc',
    content: [
      { type: 'outline-title', content: [{ type: 'text', text: 'H1' }] },
      { type: 'outline-title-2', content: [{ type: 'text', text: 'H2' }] },
      { type: 'outline-title-3', content: [{ type: 'text', text: 'H3' }] },
      { type: 'outline-title-4', content: [{ type: 'text', text: 'H4' }] },
      { type: 'outline-title-5', content: [{ type: 'text', text: 'H5' }] },
      { type: 'outline-title-6', content: [{ type: 'text', text: 'H6' }] },
    ]
  };
  const result = parser.parse(doc);
  assert(result.includes('# H1'), '包含 # H1');
  assert(result.includes('## H2'), '包含 ## H2');
  assert(result.includes('### H3'), '包含 ### H3');
  assert(result.includes('#### H4'), '包含 #### H4');
  assert(result.includes('##### H5'), '包含 ##### H5');
  assert(result.includes('###### H6'), '包含 ###### H6');
}

// ============================================================
// T6: 无序列表
// ============================================================
console.log('\n--- T6: 无序列表 ---');
{
  const doc = {
    type: 'doc',
    attrs: { listdatas: {} },
    content: [
      { type: 'paragraph', attrs: { listType: 'bullet', listId: 'list1', listLevel: 0 }, content: [{ type: 'text', text: 'Item A' }] },
      { type: 'paragraph', attrs: { listType: 'bullet', listId: 'list1', listLevel: 0 }, content: [{ type: 'text', text: 'Item B' }] },
      { type: 'paragraph', attrs: { listType: 'bullet', listId: 'list1', listLevel: 1 }, content: [{ type: 'text', text: 'Sub Item' }] },
    ]
  };
  const result = parser.parse(doc);
  assert(result.includes('- Item A'), '包含 - Item A');
  assert(result.includes('- Item B'), '包含 - Item B');
  assert(result.includes('    - Sub Item'), '包含缩进的子列表项');
}

// ============================================================
// T7: 有序列表
// ============================================================
console.log('\n--- T7: 有序列表 ---');
{
  const doc = {
    type: 'doc',
    attrs: { listdatas: {} },
    content: [
      { type: 'paragraph', attrs: { listType: 'ordered', listId: 'ol1', listLevel: 0 }, content: [{ type: 'text', text: 'First' }] },
      { type: 'paragraph', attrs: { listType: 'ordered', listId: 'ol1', listLevel: 0 }, content: [{ type: 'text', text: 'Second' }] },
      { type: 'paragraph', attrs: { listType: 'ordered', listId: 'ol1', listLevel: 0 }, content: [{ type: 'text', text: 'Third' }] },
    ]
  };
  const result = parser.parse(doc);
  assert(result.includes('1. First'), '包含 1. First');
  assert(result.includes('2. Second'), '包含 2. Second');
  assert(result.includes('3. Third'), '包含 3. Third');
}

// ============================================================
// T8a: 代码块（含单个反引号，3 个反引号定界符即可）
// ============================================================
console.log('\n--- T8a: 代码块（含单个反引号）---');
{
  const doc = {
    type: 'doc',
    content: [{
      type: 'code_block',
      attrs: { lang: 'js' },
      content: [{ type: 'text', text: 'const s = `hello`;\nconsole.log(s);' }]
    }]
  };
  const result = parser.parse(doc);
  assert(result.includes('```js'), '使用 3 个反引号 + 语言标签');
  assert(result.includes('const s = `hello`'), '代码内容完整保留');
}

// ============================================================
// T8b: 代码块（含连续三个反引号，需要升级定界符）
// ============================================================
console.log('\n--- T8b: 代码块（含连续三个反引号）---');
{
  const codeContent = 'echo "```body.txt"\ncat file.md';
  const doc = {
    type: 'doc',
    content: [{
      type: 'code_block',
      attrs: { lang: 'bash' },
      content: [{ type: 'text', text: codeContent }]
    }]
  };
  const result = parser.parse(doc);
  assert(result.includes('````'), '使用 4+ 个反引号包裹含 ``` 的代码');
  assert(result.includes(codeContent), '代码内容完整保留');
}

// ============================================================
// T9: 表格渲染
// ============================================================
console.log('\n--- T9: 表格渲染 ---');
{
  const doc = {
    type: 'doc',
    content: [{
      type: 'outline-table',
      content: [
        {
          type: 'outline-table-row',
          content: [
            { type: 'outline-table-cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name' }] }] },
            { type: 'outline-table-cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Age' }] }] },
          ]
        },
        {
          type: 'outline-table-row',
          content: [
            { type: 'outline-table-cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alice' }] }] },
            { type: 'outline-table-cell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '30' }] }] },
          ]
        }
      ]
    }]
  };
  const result = parser.parse(doc);
  assert(result.includes('| Name | Age |'), '包含表头行');
  assert(result.includes('| --- | --- |'), '包含分隔线');
  assert(result.includes('| Alice | 30 |'), '包含数据行');
}

// ============================================================
// T10: 引用块 (sub_doc)
// ============================================================
console.log('\n--- T10: 引用块 ---');
{
  const doc = {
    type: 'doc',
    content: [{
      type: 'sub_doc',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: 'This is a quote' }]
      }]
    }]
  };
  const result = parser.parse(doc);
  assert(result.includes('> '), '包含引用前缀 >');
  assert(result.includes('This is a quote'), '引用内容完整');
}

// ============================================================
// 测试汇总
// ============================================================
console.log(`\n========================================`);
console.log(`  测试结果: ${passed} 通过, ${failed} 失败`);
console.log(`========================================\n`);

process.exit(failed > 0 ? 1 : 0);
