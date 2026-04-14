/**
 * 处理 Markdown 的保留字符转义，防止破坏生成的 Markdown 结构。
 */
export function escapeMarkdown(text: string): string {
  if (!text) return '';
  // 匹配常见的 Markdown 关键符号
  return text.replace(/([\\`*_{}\[\]()#+\-.!>|~])/g, '\\$1');
}

/**
 * 清理多个连续的空行，将其压缩为最多两个空行
 */
export function cleanEmptyLines(markdown: string): string {
  // \n{3,} 替换为 \n\n，这样块与块之间最多保留一个空行
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
}
