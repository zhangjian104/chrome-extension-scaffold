import { inject } from 'vue';
import type { Container } from 'inversify';

export const DI_CONTAINER_KEY = Symbol('DI_CONTAINER');

export function useInject<T>(identifier: symbol): T {
  const container = inject<Container>(DI_CONTAINER_KEY);
  if (!container) {
    throw new Error('DI Container not found in Vue App');
  }
  return container.get<T>(identifier);
}
