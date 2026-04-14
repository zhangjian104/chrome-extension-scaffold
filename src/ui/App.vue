<template>
  <div style="padding: 16px; width: 300px; font-family: sans-serif;">
    <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">全链路探针测试</h2>
    <input 
      v-model="payload" 
      style="border: 1px solid #ccc; padding: 6px; width: 100%; box-sizing: border-box; margin-bottom: 8px; border-radius: 4px;"
      placeholder="输入将被挂载到 Reddit window 的文本" 
    />
    <button 
      @click="sendProbe" 
      :disabled="loading"
      style="background-color: #3b82f6; color: white; border: none; padding: 8px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 12px;"
    >
      {{ loading ? '发送中...' : '🚀 发射探针' }}
    </button>

    <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 8px; padding-top: 12px; border-top: 1px solid #eee;">金山文档导出</h2>
    <button 
      @click="exportMarkdown" 
      :disabled="exportLoading"
      style="background-color: #10b981; color: white; border: none; padding: 8px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold;"
    >
      {{ exportLoading ? '解析并导出中...' : '📝 导出 Markdown' }}
    </button>

    <div style="margin-top: 12px; font-size: 12px;" :style="{ color: statusColor }">
      {{ status }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ExtensionAction } from '@/common/types/messages';
import { useInject } from '@/ui/composables/useInject';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';

const logger = useInject<Logger>(SERVICE_IDENTIFIER.Logger);

const payload = ref('Hacked by WXT Ext');
const loading = ref(false);
const exportLoading = ref(false);
const status = ref('等待操作');
const isSuccess = ref(true);

const statusColor = computed(() => isSuccess.value ? '#10b981' : '#ef4444');

const exportMarkdown = async () => {
  exportLoading.value = true;
  status.value = '正在向当前页面发送导出指令...';
  isSuccess.value = false;

  logger.info('开始请求导出 Markdown');

  try {
    // 获取当前活动标签页
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
      throw new Error('未找到当前活动标签页');
    }

    // 直接发给 Content Script
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
      status.value = '✅ 导出成功！请查看下载内容';
      isSuccess.value = true;
    } else {
      throw new Error('当前页面不支持导出或未正确加载');
    }
  } catch (error: any) {
    status.value = `❌ 失败: ${error.message}`;
    isSuccess.value = false;
    logger.error('请求导出 Markdown 失败', error);
  } finally {
    exportLoading.value = false;
  }
};

const sendProbe = async () => {
  loading.value = true;
  status.value = '正在向 Background 发送...';
  isSuccess.value = false;
  
  logger.info(`开始发送探针，内容: ${payload.value}`);
  
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: ExtensionAction.HACK_INIT,
        payload: payload.value
      }, (res) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(res);
        }
      });
    });

    const typedResponse = response as any;
    if (typedResponse?.success && typedResponse?.result) {
      status.value = '✅ 探针链路执行完毕';
      isSuccess.value = true;
    } else {
      throw new Error(typedResponse?.error || '执行失败');
    }
  } catch (error: any) {
    status.value = `❌ 失败: ${error.message}`;
    isSuccess.value = false;
    logger.error('发送探针失败', error);
  } finally {
    loading.value = false;
  }
};
</script>
