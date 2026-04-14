# 金山智能文档转 Markdown 解析器 (Parser) 实现规划

根据对提供的金山文档数据结构 (`ap1.json`、`ap2.json`) 的分析，为了实现将 `window.APP.OTL.state.doc` 解析为 Markdown，制定以下本地 Parser 实现规划。

## 1. 数据结构分析

金山智能文档的数据结构是一个深层嵌套的 AST (抽象语法树) 树状结构。

**顶层结构：**
```json
{
    "type": "doc",
    "attrs": { ... }, // 包含文档全局属性，如 listdatas（列表样式字典）
    "content": [ ... ] // 逻辑块数组
}
```

**核心嵌套层级：**
1. `logic_block` (逻辑块)：顶层容器，通常代表文档中的一个主要区块。
2. `block_tile` (块状容器)：用于包裹实际的内容节点。
3. **内容节点** (如 `paragraph`, `heading`, `code_block`, `picture`, `circle_object`, `sub_doc` 等)。
4. `text` (文本节点) 及其他行内节点 (如 `emoji`, `link_view` 等)：通常包含在 `content` 数组中，带有各种格式标记（`marks`，如粗体、字号、颜色等）。

**需要重点处理的特性及潜在风险点：**

*   **列表 (Lists)**：金山文档的列表并不像标准 Markdown 一样有明确的 `list_item` (如 `<ul><li>`) 包裹，而是通过段落（`paragraph` 或 `heading`）上的 `attrs.listType`、`attrs.listId`、`attrs.listLevel`、`attrs.listValue` 属性来表示。**难点在于：需要通过上下文状态（跨多个 sibling 节点）来渲染正确的列表缩进和有序列表的连续序号。**
*   **复杂嵌套模块**：
    *   `circle_object`: 用于实现分栏排版 (如 `CircleColumn` -> `CircleColumnItem` -> `CircleObjectTile` -> `image_column_container`)。
    *   `sub_doc`: 用于实现高亮块、引用块、标注框等 (如 `HighlightBlock` -> `sub_doc_object` -> `sub_doc_layout_object` -> `sub_doc_tile`)。
    *   **处理策略**：由于 Markdown 不支持复杂的 Flex 分栏或特殊的 UI 容器，我们需要对其进行**降级处理**（提取出内部的纯文本或图片信息），或者转换为 Markdown 支持的 Quote (`>`) 形式。但必须保证深层遍历不会丢失关键内容。
*   **行内样式 (Marks)**：目前发现的有 `fontSize`, `bold`, `underline` 等。对于 `underline` 和 `fontSize`，标准 Markdown 并不原生支持，可能需要权衡是丢弃、转为 HTML 标签（如 `<u>`，`<span>`）还是转为相近的 Markdown 语法（如 `**`）。
*   **换行处理 (`hard_break`)**：段落内的软换行节点，需要正确转换为 Markdown 换行（`<br>` 或双空格回车）。

## 2. Parser 架构设计

考虑到 AST 的深层嵌套和类型的多样性，必须采用**扩展性好、状态易于管理的访问者模式 (Visitor Pattern)** 进行节点遍历。

### 2.1 目录结构

所有代码放在独立的 `parser/` 目录下，保持与 Chrome 插件环境的隔离，方便后期直接作为 npm 包引入或移植。

```text
parser/
├── src/
│   ├── index.ts                # 入口文件，导出 KDocParser 和 parse 函数
│   ├── types.ts                # 依据 ap*.json 提取和定义的 AST 节点 TypeScript 接口
│   ├── KDocParser.ts           # 核心解析器类 (控制遍历、维护上下文)
│   ├── handlers/               # 各类节点的具体处理策略 (Visitor的具体实现)
│   │   ├── index.ts            # 集中注册所有 handler
│   │   ├── BaseHandler.ts      # Handler 基类或接口
│   │   ├── BlockHandlers.ts    # 处理 logic_block, block_tile 等容器
│   │   ├── TextHandlers.ts     # 处理 paragraph, heading, text, hard_break
│   │   ├── MediaHandlers.ts    # 处理 picture, code_block, link_view
│   │   └── AdvancedHandlers.ts # 处理 sub_doc, circle_object 等复杂容器降级
│   └── utils/
│       ├── list-state.ts       # 【核心难点】列表状态管理器 (处理缩进、有序序列计算)
│       └── markdown-utils.ts   # Markdown 字符转义工具 (防止原始文本破坏 md 结构)
├── package.json
├── tsconfig.json
└── tests/
    ├── run.ts                  # 本地测试运行脚本
    └── fixtures/               # 测试用例目录 (存放 ap1.json, ap2.json)
```

### 2.2 核心解析器类设计

`KDocParser` 类负责控制遍历流程，维护上下文状态。

```typescript
// ParserContext 用于在整个遍历过程中传递和累积状态
export interface ParserContext {
  listDatas: Record<string, any>; // 存放全局列表样式配置
  listStateTracker: ListStateTracker; // 实例化的列表状态追踪器
  // 可以根据需要增加其他全局状态，如：
  // isInsideQuote: boolean 
}

class KDocParser {
  private context: ParserContext;

  constructor(docJson: any) {
    this.context = {
      listDatas: docJson.attrs?.listdatas || {},
      listStateTracker: new ListStateTracker(docJson.attrs?.listdatas || {})
    };
  }

  // 主入口
  public parse(ast: KDocNode): string {
    const rawMarkdown = this.renderNode(ast);
    return this.postProcess(rawMarkdown); // 后处理：例如清理多余的连续空行
  }

  // 递归路由
  public renderNode(node: KDocNode): string {
    const handler = getHandler(node.type);
    if (handler) {
       return handler.handle(node, this, this.context);
    }
    
    // 遇到不认识的容器节点（兜底策略），直接剥离外壳，遍历其子节点
    if (node.content && Array.isArray(node.content)) {
       return node.content.map(n => this.renderNode(n)).join('');
    }
    
    // 对于未知且无 content 的叶子节点，返回空字符串
    return '';
  }
}
```

## 3. 节点映射规则 (Node Mapping)

| 金山文档 Node Type | Markdown 语法映射 | 处理要点 / 风险点 |
| :--- | :--- | :--- |
| `doc` | 根容器 | 遍历 `content`，连接结果。 |
| `logic_block`, `block_tile` | 容器降级 | **透明穿透**。遍历 `content` 并连接。注意块与块之间的换行（留一个空行）处理，避免 md 挤在一起。 |
| `heading` | `#` ~ `######` | 根据 `attrs.level` 决定 `#` 的数量。**必须检查列表属性**，如果有列表属性，可能需要将其作为列表项处理，或者在标题前加标号。 |
| `paragraph` | 普通文本 / 列表项 | **核心逻辑**：检查 `attrs.listType`。如果是列表，调用 `ListStateTracker` 计算前缀（缩进 + 符号）；如果不是，作为普通段落输出（末尾加换行）。 |
| `text` | 普通文本 | 处理 `marks`。`bold`->`**text**`, `underline`->由于 md 不支持，可考虑忽略或转换为 HTML `<u>`。**需转义文本中的特殊 Markdown 字符**（如 `*`, `_`, `#`, `>` 等），以防干扰渲染。 |
| `hard_break` | `<br/>` 或双空格换行 | 段落内强制换行符。由于在列表和引用中，建议使用 `<br/>` 以保证块的连续性。 |
| `code_block` | ` ```lang ... ``` ` | 提取 `attrs.lang`。遍历其 `content`（通常是 text 节点）并提取。注意去除代码文本内部被误当做 markdown 的转义。 |
| `picture` | `![caption](src)` | 提取 `attrs.caption` 或 `attrs.title`。`src` 可能为空（如果是本地上传未同步或防盗链），需要处理 `src` 为空时的占位符展示。 |
| `blockquote` | `> text` | 在遍历其 `content` 之前，设置上下文 `isInsideQuote = true`，或直接在生成的每行前面加 `> `。 |
| `link_view` | `[title](url)` | 超链接，提取 `attrs.hrefTitle` 和 `attrs.url`。 |
| `emoji` | Emoji 字符 | 提取 `attrs.emoji` 字段（如 📢）。 |
| `circle_object` (分栏) | 降级处理 | 忽略其排版（`CircleColumn`, `CircleColumnItem`），直接递归渲染其内部的文本和图片，顺序拼接。 |
| `sub_doc` (高亮块) | `> text` | 由于 `sub_doc` 经常用于表示重要提示或引用，建议将其降级渲染为 Markdown 的 Quote (`>`) 块。 |

## 4. 关键技术方案

### 4.1 列表解析策略 (List State Tracker)

由于金山文档列表扁平化，我们需要一个 `ListStateTracker` 来跨段落维护状态。

**状态机逻辑：**
1.  维护一个堆栈 `listStack: { listId: string, level: number, currentCount: number }[]`。
2.  当遇到带有 `listId` 的 `paragraph`：
    *   **新列表/层级加深**：如果 `listId` 或 `listLevel` 变化，入栈，重置 count。
    *   **同级列表继续**：如果 `listId` 和 `listLevel` 相同，`currentCount++`。
    *   **层级回退**：如果 `listLevel` 减小，出栈到对应层级。
3.  **缩进计算**：根据 `listLevel` 返回对应的空格数（如 `level * 4`）。
4.  **符号生成**：如果是 `ordered` 且带有 `value` (如 `aribicNum`)，返回 `${currentCount}. `；如果是 `bullet`，返回 `- ` 或 `* `。
5.  **结束列表**：当遇到一个**没有** `listId` 的段落时，清空 `listStack`，并在生成的 md 前补一个空行，以结束 Markdown 列表作用域。

### 4.2 空白字符与换行控制 (Whitespace Management)

Markdown 对空行非常敏感：
*   **段落之间**必须有至少一个空行。
*   **列表项之间**可以没有空行（紧凑列表）或有空行（松散列表）。
*   **代码块**前后必须有空行。

**解决方案：**
不建议在 Handler 内部手动硬编码拼接 `\n\n`（容易造成不可控的多余空行或空行缺失）。
推荐做法：
1.  定义 Markdown 块类型。每个 Handler 返回的数据可以是一个对象 `{ type: 'block' | 'inline', text: string }`，由 `KDocParser` 在连接 `block` 类型时自动注入双换行，在连接 `inline` 时直接拼接。
2.  或者，最简单的做法：所有 Handler 返回纯字符串。在 `KDocParser` 最终得到完整字符串后，执行一次正则**后处理 (Post-Processing)**：将连续的 3 个及以上的换行符替换为 2 个换行符 (`replace(/\n{3,}/g, '\n\n')`)。

## 5. 本地开发与测试流程 (Parser 落地)

当前阶段只在 `parser/` 目录下完成本地纯 Node.js 环境的解析与验证。

**第一阶段：基础设施搭建**
1.  初始化 `parser` 目录的 `package.json`，安装 `typescript`, `ts-node`, `vitest` 或 `jest` (用于编写单元测试)。
2.  创建 `types.ts` 和基本的 `KDocParser` 骨架。

**第二阶段：基础 Node 解析实现**
3.  实现 `Text` (包含 Mark 转义) 和普通 `Paragraph` 的解析。
4.  实现 `Heading` 和 `CodeBlock`。
5.  编写 `ListStateTracker`，并将其接入到 `Paragraph` 处理器中。

**第三阶段：复杂模块与测试验证**
6.  实现对 `ap1.json` 中图片、高亮块(`sub_doc`) 的降级解析。
7.  实现对 `ap2.json` 中分栏(`circle_object`) 的透明穿透解析。
8.  编写 E2E 测试脚本，运行 `ap1.json` 和 `ap2.json`，将结果输出为 `ap1.md` 和 `ap2.md`。

**第四阶段：人工 Code Review 与优化**
9.  通过 VSCode 预览生成的 `.md` 文件，检查：
    *   标题层级是否正确。
    *   代码块是否完整，语言标识是否提取。
    *   **核心**：有序列表的序号是否连续递增，嵌套列表的缩进是否正确。
    *   图片位置和说明是否合理提取。
    *   有没有因为空行处理不当导致的版面破碎。
10. 针对问题微调 Handler 逻辑。

*(以上为经过 CR 并完善的 Parser 实现规划文档，下一步将按照此蓝图开始编码)*