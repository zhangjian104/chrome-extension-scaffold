# v1/messages 接口详解

- 本文档介绍了如何调用 `/v1/messages` 接口。该接口完全兼容 Claude API 规范，并对接了 WPS 内部 AI 网关，适用于 Claude 系列的模型。
- **参考链接**：Claude API Docs - Create a Message

> 📌1. 部署的云服务器域名为 `https://etai-benchmark.wps.cn`
> 2. 本地配置**测试环境**，并添加额外的 host：**121.36.74.228 ****etai-benchmark.wps.cn**。

## 1. 接口基础信息

- **接口地址**：https://etai-benchmark.wps.cn/v1/messages
- **请求方法**: `POST`

## 2. 请求参数 (Request Body)

请求体为 JSON 格式，字段定义如下：

### 必填参数

| **字段名** | **类型** | **说明** | **示例** |
| --- | --- | --- | --- |
| `model` | String | 要调用的模型名称。详见下方可用模型列表。 | `"claude-3-5-sonnet"` |
| `messages` | Array | 对话消息列表。 | `[{"role": "user", "content": "你好"}]` |
| `max_tokens` | Integer | 生成回复的最大 token 数量。 | `1024` |

**可用模型列表 (****`model`**** 字段支持的值)**:

- `claude-3-5-haiku`
- `claude-3-5-sonnet`
- `claude-3-haiku`
- `claude-3-sonnet`
- `claude-opus-4-5`
- `claude-opus-4-6-v1` （当前效果最好的模型）
- `claude-sonnet-4`
- `claude-sonnet-4-5`

*(注意：**`claude-3-opus`** 和 **`claude-opus-4`** 当前不可用，请勿使用)*

**`messages`**** 数组元素说明**:

- `role`: 角色，可选值为 `"user"` 或 `"assistant"`。
- `content`: 消息内容，支持纯字符串，或包含 `type` 和 `text` 的对象数组（如 `[{"type": "text", "text": "你好"}]`）。

### 选填参数

| **字段名** | **类型** | **说明** |
| --- | --- | --- |
| `system` | String/Array | 系统提示词 (System Prompt)。如果不传，将使用默认的 WPS AI 助理提示词。 |
| `stream` | Boolean | 是否使用流式输出 (Server-Sent Events)。默认为 `false`。 |
| `temperature` | Float | 采样温度，控制输出的随机性。 |
| `top_p` | Float | 核心采样参数。 |
| `top_k` | Integer | 采样候选数量。 |
| `stop_sequences` | Array | 停止词列表，遇到这些词时停止生成。 |

## 3. 响应格式 (Response)

### 3.1 非流式响应 (`stream: false`)

返回标准的 JSON 对象，包含完整的回复内容和 Token 消耗统计。

```json
{
  "id": "msg_171031234567890",
  "type": "message",
  "role": "assistant",
  "model": "claude-3-5-sonnet",
  "content": [
    {
      "type": "text",
      "text": "你好！我是 WPS AI 助理，很高兴为你服务。"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 15,
    "output_tokens": 20
  },
  "times": [1.25],
  "time_first": [1.25]
}
```

*(注：**`times`** 和 **`time_first`** 为 WPS 评测自定义扩展字段，表示耗时)*

### 3.2 流式响应 (`stream: true`)

返回 `text/event-stream` 格式的数据流。事件类型完全遵循 Claude 规范：

1. `message_start`
2. `content_block_start`
3. `content_block_delta` (包含增量文本 `text_delta`)
4. `content_block_stop`
5. `message_delta` (包含停止原因和 usage 统计)
6. `message_stop`

```typescript
// 流式数据返回示例
event: message_start
data: {"message":{"id":"msg_1773629631870394198","model":"claude-3-5-sonnet","role":"assistant","stop_reason":null,"stop_sequence":null,"type":"message","usage":{"input_tokens":0,"output_tokens":0}},"type":"message_start"}

event: content_block_start
data: {"content_block":{"text":"","type":"text"},"index":0,"type":"content_block_start"}

event: content_block_delta
data: {"delta":{"text":"好的,我来为您创作一首关于春天的诗:\n\n春","type":"text_delta"},"index":0,"type":"content_block_delta"}

event: content_block_delta
data: {"delta":{"text":"风拂面\n\n春风轻拂面,\n百","type":"text_delta"},"index":0,"type":"content_block_delta"}

... ...

event: content_block_delta
data: {"delta":{"text":"望这首诗能带给您春天的美好感受。","type":"text_delta"},"index":0,"type":"content_block_delta"}

event: content_block_stop
data: {"index":0,"type":"content_block_stop"}

event: message_delta
data: {"delta":{"stop_reason":"end_turn"},"type":"message_delta","usage":{"input_tokens":88,"output_tokens":259}}

event: message_stop
data: {"type":"message_stop"}
```

## 4. 调用示例

> 📌1. 部署的云服务器域名为 `https://etai-benchmark.wps.cn`
> 2. 本地配置**测试环境**，并添加额外的 host：**121.36.74.228 ****etai-benchmark.wps.cn**。

### 4.1 添加白名单

- 在调用 v1/messages 接口之前需要先将**本机公网 IP 地址**添加到白名单，可以在 收集公网 IP 相关信息 表单中进行填写。

> 📌
> 本机公网 IP 地址可通过【curl cip.cc】命令获得。

### 4.1 cURL 示例 (非流式)

**Windows CMD:**

```plaintext
curl -X POST "https://etai-benchmark.wps.cn/v1/messages" -H "Content-Type: application/json" -d "{\"model\": \"claude-opus-4-6-v1\", \"max_tokens\": 1024, \"messages\": [{\"role\": \"user\", \"content\": \"请写一首关于春天的诗。\"}]}"
```

### 4.2 前端 JavaScript 示例（快速测试）

在前端浏览器环境中，可以使用原生的 `fetch` API 来调用该接口。由于接口配置了 CORS 规则，请确保你的前端页面运行在允许的域名下（如 `*.``wps.cn` 或 `*.``kdocs.cn`）。

> 📌
> 在浏览器的 **console 面板**中输入如下代码，然后在 **Network 面板**中查看具体的响应数据。

#### 1. 非流式请求（简单，一次性返回）

等待 AI 完全生成完毕后，一次性返回结果。

```javascript
const response = await fetch("https://etai-benchmark.wps.cn/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-3-5-sonnet",
    max_tokens: 1024,
    stream: false,
    messages: [{ role: "user", content: "请写一首关于春天的诗。" }]
  })
});

const data = await response.json();
data.content[0].text; // 等待几秒，控制台会打印完整回复
```

#### 2. 流式请求（打字机效果，逐步返回）

开启 `stream: true`

```javascript
const response = await fetch("https://etai-benchmark.wps.cn/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-3-5-sonnet",
    max_tokens: 1024,
    stream: true, // 开启流式
    messages: [{ role: "user", content: "请写一首关于春天的诗。" }]
  })
});
```