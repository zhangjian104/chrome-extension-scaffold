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
      style="background-color: #3b82f6; color: white; border: none; padding: 8px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold;"
    >
      {{ loading ? '发送中...' : '🚀 发射探针' }}
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
const status = ref('请在 Reddit 页面点击发射');
const isSuccess = ref(false);

const statusColor = computed(() => isSuccess.value ? '#10b981' : '#ef4444');

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
