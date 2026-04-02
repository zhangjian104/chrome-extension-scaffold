import 'reflect-metadata';
import { createApp } from 'vue';
import App from '@/ui/App.vue';
import { createPopupContainer } from '@/core/di/container';
import { DI_CONTAINER_KEY } from '@/ui/composables/useInject';
import { SERVICE_IDENTIFIER } from '@/core/di/identifiers';
import type { Logger } from '@/common/logger';

// 1. 初始化 Popup 环境的 IoC 容器
const container = createPopupContainer();
const logger = container.get<Logger>(SERVICE_IDENTIFIER.Logger);

logger.info('Popup initialized');

// 2. 启动 Vue App
const app = createApp(App);

// 3. 将 DI 容器 Provide 给 Vue App，使得 Setup 里可以通过 useInject 获取服务
app.provide(DI_CONTAINER_KEY, container);

app.mount('#app');
