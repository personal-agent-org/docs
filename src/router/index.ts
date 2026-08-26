import { defineRouter } from '#q-app';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { setSiteLocale } from '@/i18n';

export default defineRouter(() => {
  const router = createRouter({
    scrollBehavior: (to, _from, savedPosition) =>
      savedPosition ?? (to.hash ? { el: to.hash, behavior: 'smooth' } : { left: 0, top: 0 }),
    routes,
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
  });
  router.beforeEach((to) =>
    setSiteLocale(to.path === '/de' || to.path.startsWith('/de/') ? 'de' : 'en', false),
  );
  return router;
});
