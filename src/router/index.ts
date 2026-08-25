import { defineRouter } from '#q-app';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import routes from './routes';

export default defineRouter(() =>
  createRouter({
    scrollBehavior: (to, _from, savedPosition) =>
      savedPosition ?? (to.hash ? { el: to.hash, behavior: 'smooth' } : { left: 0, top: 0 }),
    routes,
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
  }),
);
