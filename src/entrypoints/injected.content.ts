import { PageMessageType } from '@/common/types/messages';

export default defineContentScript({
  matches: ['*://*.reddit.com/*'],
  world: 'MAIN',
  main() {
    console.log('[Injected] Main world script ready. Waiting for events...');

    // 监听隔离世界通过 window.postMessage 传来的探针消息
    window.addEventListener('message', (event) => {
      // 过滤非本窗口的闲杂消息
      if (event.source !== window) return;

      if (event.data?.type === PageMessageType.EXT_PING) {
        const payload = event.data.payload;
        console.log('[Injected] 收到隔离世界发来的探针数据:', payload);

        // 强行挂载全局变量到主世界的 window (这是突破隔离的核心目的)
        (window as any).__MY_EXT_HACK__ = payload;
        
        console.log(`[Injected] 已经将数据挂载到 window.__MY_EXT_HACK__! 你可以在控制台里输入 window.__MY_EXT_HACK__ 试试。`);

        // 将成功信息回复给隔离世界
        window.postMessage({ type: PageMessageType.PAGE_PONG, status: 'success' }, '*');
      }
    });
  },
});
