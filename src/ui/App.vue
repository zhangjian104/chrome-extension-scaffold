<template>
  <div class="popup">
    <!-- 头部 -->
    <header class="popup__header">
      <div class="popup__brand">
        <svg class="popup__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <h1 class="popup__title">KDoc Exporter</h1>
      </div>
      <p class="popup__subtitle">金山文档 Markdown 导出工具</p>
    </header>

    <!-- 主操作区 -->
    <main class="popup__body">
      <button
        class="btn-export"
        :class="{
          'btn-export--loading': exportLoading,
          'btn-export--checking': isChecking
        }"
        :disabled="!isTargetPage || isChecking || exportLoading"
        @click="exportMarkdown"
      >
        <!-- checking spinner -->
        <svg v-if="isChecking" class="btn-export__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
        </svg>
        <!-- loading spinner -->
        <svg v-else-if="exportLoading" class="btn-export__spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
          <line x1="2" y1="12" x2="6" y2="12"/>
          <line x1="18" y1="12" x2="22" y2="12"/>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
        </svg>
        <!-- download icon -->
        <svg v-else class="btn-export__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>{{ buttonLabel }}</span>
      </button>
    </main>

    <!-- 状态栏 -->
    <footer class="popup__status" :class="statusClass">
      <!-- 检测中 / 加载中 -->
      <svg v-if="phase === 'checking' || phase === 'loading'" class="popup__status-icon popup__status-icon--spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
      <!-- 就绪 -->
      <svg v-else-if="phase === 'idle'" class="popup__status-icon" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="4"/>
      </svg>
      <!-- 成功 -->
      <svg v-else-if="phase === 'success'" class="popup__status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <!-- 不可用 -->
      <svg v-else-if="phase === 'unavailable'" class="popup__status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <!-- 失败 -->
      <svg v-else-if="phase === 'error'" class="popup__status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <span class="popup__status-text">{{ status }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ExtensionAction } from '@/common/types/messages';
import { useInject } from '@/ui/composables/useInject';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';

const logger = useInject<Logger>(SERVICE_IDENTIFIER.Logger);

const isTargetPage = ref(false);
const isChecking = ref(true);
const exportLoading = ref(false);
const status = ref('正在检测页面...');
const phase = ref<'checking' | 'idle' | 'loading' | 'success' | 'error' | 'unavailable'>('checking');

const statusClass = computed(() => `popup__status--${phase.value}`);

const buttonLabel = computed(() => {
  if (isChecking.value) return '检测页面中...';
  if (exportLoading.value) return '解析并导出中...';
  if (!isTargetPage.value) return '导出 Markdown';
  return '导出 Markdown';
});

let aborted = false;
onUnmounted(() => { aborted = true; });

type PageStatus = 'supported' | 'unsupported' | 'pending';

function sendCheckPage(tabId: number): Promise<PageStatus> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { action: ExtensionAction.CHECK_PAGE }, (res) => {
        if (chrome.runtime.lastError) {
          resolve('pending');
        } else {
          resolve(res === 'supported' || res === 'unsupported' ? res : 'pending');
        }
      });
    } catch {
      resolve('pending');
    }
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

onMounted(async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tabs[0]?.url || '';

    // 阶段 1：URL 快速匹配
    if (!/\.kdocs\.cn\//.test(url)) {
      isChecking.value = false;
      isTargetPage.value = false;
      phase.value = 'unavailable';
      status.value = '请在金山文档页面使用';
      return;
    }

    // 阶段 2：轮询检查 office_type，每 200ms 一次，最多 10s
    const tabId = tabs[0].id!;
    const INTERVAL = 200;
    const TIMEOUT = 10_000;
    const startTime = Date.now();

    while (!aborted && Date.now() - startTime < TIMEOUT) {
      const result = await sendCheckPage(tabId);
      if (result === 'supported') {
        isTargetPage.value = true;
        isChecking.value = false;
        phase.value = 'idle';
        status.value = '就绪，等待操作';
        return;
      }
      if (result === 'unsupported') {
        isChecking.value = false;
        isTargetPage.value = false;
        phase.value = 'unavailable';
        status.value = '当前文档类型不支持导出（仅支持智能文档）';
        return;
      }
      await sleep(INTERVAL);
    }

    // 10s 耗尽仍为 pending
    isChecking.value = false;
    isTargetPage.value = false;
    phase.value = 'unavailable';
    status.value = '页面加载超时，请刷新后重试';
  } catch (e: any) {
    isChecking.value = false;
    isTargetPage.value = false;
    phase.value = 'unavailable';
    status.value = '页面检测失败';
    logger.error('页面检测失败', e);
  }
});

const exportMarkdown = async () => {
  exportLoading.value = true;
  status.value = '正在解析文档...';
  phase.value = 'loading';

  logger.info('开始请求导出 Markdown');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
      throw new Error('未找到当前活动标签页');
    }

    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabs[0].id!, {
        action: ExtensionAction.EXPORT_MARKDOWN
      }, (res) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(res);
        }
      });
    });

    if (response) {
      status.value = '导出成功！请查看下载内容';
      phase.value = 'success';
    } else {
      throw new Error('当前页面不支持导出或未正确加载');
    }
  } catch (error: any) {
    status.value = error.message;
    phase.value = 'error';
    logger.error('请求导出 Markdown 失败', error);
  } finally {
    exportLoading.value = false;
  }
};
</script>

<style scoped>
.popup {
  --color-primary: #0891B2;
  --color-cta: #0D9488;
  --color-cta-hover: #0F766E;
  --color-bg: #F0FDFA;
  --color-surface: #FFFFFF;
  --color-text: #134E4A;
  --color-text-secondary: #5F7B7A;
  --color-border: #CCFBF1;
  --color-error: #DC2626;
  --color-error-bg: #FEF2F2;
  --color-success: #16A34A;
  --color-success-bg: #F0FDF4;
  --color-idle: #94A3B8;
  --color-unavailable: #94A3B8;
  --radius: 10px;
  --transition: 200ms ease;

  width: 320px;
  background: var(--color-bg);
  font-family: Inter, system-ui, sans-serif;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ---- Header ---- */
.popup__header {
  padding: 20px 20px 16px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.popup__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.popup__logo {
  width: 22px;
  height: 22px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.popup__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-text);
}

.popup__subtitle {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0;
  padding-left: 30px;
}

/* ---- Body ---- */
.popup__body {
  padding: 20px;
}

/* ---- CTA Button ---- */
.btn-export {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 11px 16px;
  border: none;
  border-radius: var(--radius);
  background: var(--color-cta);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background var(--transition), box-shadow var(--transition), transform 100ms ease;
  outline: none;
}

.btn-export:hover:not(:disabled) {
  background: var(--color-cta-hover);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}

.btn-export:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-export:focus-visible {
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.4);
}

.btn-export:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-export--loading,
.btn-export--checking {
  background: var(--color-text-secondary);
}

.btn-export__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-export__spinner {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  animation: spin 1s linear infinite;
}

/* ---- Status Footer ---- */
.popup__status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px 14px;
  font-size: 12px;
  line-height: 1.4;
  transition: color var(--transition), background var(--transition);
}

.popup__status--checking {
  color: var(--color-primary);
}

.popup__status--idle {
  color: var(--color-idle);
}

.popup__status--loading {
  color: var(--color-primary);
}

.popup__status--success {
  color: var(--color-success);
  background: var(--color-success-bg);
}

.popup__status--error {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.popup__status--unavailable {
  color: var(--color-unavailable);
}

.popup__status-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.popup__status-icon--spin {
  animation: spin 1s linear infinite;
}

.popup__status-text {
  flex: 1;
  min-width: 0;
}

/* ---- Animations ---- */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
