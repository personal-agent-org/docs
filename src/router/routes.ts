import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/SiteLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/HomePage.vue') },
      {
        path: 'marketplace',
        name: 'marketplace',
        component: () => import('@/pages/MarketplacePage.vue'),
      },
      {
        path: 'marketplace/:slug',
        name: 'marketplace-detail',
        component: () => import('@/pages/MarketplaceDetailPage.vue'),
      },
      {
        path: 'docs/:pathMatch(.*)*',
        name: 'docs',
        component: () => import('@/pages/DocsPage.vue'),
      },
      {
        path: '/:catchAll(.*)*',
        component: () => import('@/pages/NotFoundPage.vue'),
      },
    ],
  },
];

export default routes;
