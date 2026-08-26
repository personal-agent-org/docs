import type { RouteRecordRaw } from 'vue-router';

const englishMarketing: RouteRecordRaw[] = [
  { path: '', name: 'home', component: () => import('@/pages/HomePage.vue') },
  {
    path: 'organizations',
    name: 'organizations',
    component: () => import('@/pages/OrganizationsPage.vue'),
  },
  {
    path: 'plus',
    name: 'plus',
    component: () => import('@/pages/PlusPage.vue'),
  },
  { path: 'cloud', name: 'hosted-cloud', component: () => import('@/pages/HostedCloudPage.vue') },
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
];

const germanMarketing: RouteRecordRaw[] = [
  { path: '', name: 'home-de', component: () => import('@/pages/HomePage.vue') },
  {
    path: 'organizations',
    name: 'organizations-de',
    component: () => import('@/pages/OrganizationsPage.vue'),
  },
  {
    path: 'plus',
    name: 'plus-de',
    component: () => import('@/pages/PlusPage.vue'),
  },
  {
    path: 'cloud',
    name: 'hosted-cloud-de',
    component: () => import('@/pages/HostedCloudPage.vue'),
  },
  {
    path: 'marketplace',
    name: 'marketplace-de',
    component: () => import('@/pages/MarketplacePage.vue'),
  },
  {
    path: 'marketplace/:slug',
    name: 'marketplace-detail-de',
    component: () => import('@/pages/MarketplaceDetailPage.vue'),
  },
];

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/SiteLayout.vue'),
    children: [
      ...englishMarketing,
      {
        path: 'docs/:pathMatch(.*)*',
        name: 'docs',
        component: () => import('@/pages/DocsPage.vue'),
      },
      { path: '/:catchAll(.*)*', component: () => import('@/pages/NotFoundPage.vue') },
    ],
  },
  {
    path: '/de',
    component: () => import('@/layouts/SiteLayout.vue'),
    children: germanMarketing,
  },
];

export default routes;
