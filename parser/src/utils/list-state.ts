export interface ListStackItem {
  listId: string;
  level: number;
  count: number;
}

export class ListStateTracker {
  private listDatas: Record<string, any>;
  private stack: ListStackItem[] = [];

  constructor(listDatas: Record<string, any>) {
    this.listDatas = listDatas || {};
  }

  public getPrefix(listId: string, listType: string, listLevel: number | string): string {
    const level = Number(listLevel) || 0;

    if (!listType) {
      this.reset();
      return '';
    }

    const currentListId = listId || 'default_bullet_list';

    // 清理栈中不在当前路径上的层级
    while (this.stack.length > 0 && this.stack[this.stack.length - 1].level >= level) {
      if (this.stack[this.stack.length - 1].level === level && this.stack[this.stack.length - 1].listId === currentListId) {
        break; // 同一层级的同一个列表，不需要清理，只需计数累加
      }
      this.stack.pop();
    }

    let currentItem = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;

    if (!currentItem || currentItem.level !== level || currentItem.listId !== currentListId) {
      // 需要压入新层级
      currentItem = { listId: currentListId, level, count: 1 };
      this.stack.push(currentItem);
    } else {
      currentItem.count++;
    }

    const indent = '    '.repeat(level);
    let symbol = '- ';

    if (listType === 'ordered') {
      const listData = this.listDatas[currentListId];
      // 简单处理，如果是中文数字或阿拉伯数字都输出数字序号以保持 Markdown 语法正确
      // Markdown 会自动根据前面的数字渲染有序列表
      symbol = `${currentItem.count}. `;
    } else {
      symbol = '- ';
    }

    return `${indent}${symbol}`;
  }

  public reset() {
    this.stack = [];
  }
}
