import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-vue'],
  webExt: {
    disabled: true,
  },
  manifest: {
    permissions: ['storage', 'tabs'],
  },
});
