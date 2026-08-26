<template>
  <q-page class="page-width marketplace-page">
    <header class="page-hero compact">
      <span class="eyebrow">{{ t('marketplace.title') }}</span>
      <h1>{{ t('marketplace.title') }}</h1>
      <p>{{ t('marketplace.intro') }}</p>
    </header>

    <div class="catalog-controls">
      <q-input
        v-model="query"
        dark
        outlined
        rounded
        clearable
        debounce="100"
        :placeholder="t('marketplace.search')"
        :aria-label="t('marketplace.search')"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="filter-row" role="group" :aria-label="t('marketplace.filter')">
        <q-btn
          v-for="option in filters"
          :key="option.value"
          rounded
          no-caps
          :unelevated="kind === option.value"
          :outline="kind !== option.value"
          color="primary"
          :label="option.label"
          @click="kind = option.value"
        />
      </div>
    </div>

    <div class="catalog-summary">
      {{ filteredItems.length }}
      {{ filteredItems.length === 1 ? t('marketplace.item') : t('marketplace.items') }}
    </div>
    <div v-if="filteredItems.length" class="market-grid">
      <MarketplaceCard v-for="item in filteredItems" :key="item.slug" :item="item" />
    </div>
    <div v-else class="empty-state">
      <q-icon name="search_off" size="42px" />
      <h2>{{ t('marketplace.emptyTitle') }}</h2>
      <p>{{ t('marketplace.emptyCopy') }}</p>
      <q-btn flat no-caps color="primary" :label="t('marketplace.clear')" @click="clearFilters" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MarketplaceCard from '@/components/MarketplaceCard.vue';
import { useSeo } from '@/composables/useSeo';
import { listMarketplaceItems } from '@/services/marketplace';
import type { MarketplaceItem, MarketplaceKind } from '@/types/marketplace';

const { t } = useI18n();
useSeo({
  title: () => t('marketplace.meta'),
  description: () => t('marketplace.seoDescription'),
  localized: true,
});

type KindFilter = 'all' | MarketplaceKind;
const filters = computed<{ label: string; value: KindFilter }[]>(() => [
  { label: t('marketplace.all'), value: 'all' },
  { label: t('marketplace.agents'), value: 'agent' },
  { label: t('marketplace.skills'), value: 'skill' },
  { label: t('marketplace.integrations'), value: 'integration' },
  { label: t('marketplace.workflows'), value: 'workflow' },
]);
const items = ref<MarketplaceItem[]>(listMarketplaceItems());
const query = ref('');
const kind = ref<KindFilter>('all');

const filteredItems = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase();
  return items.value.filter((item) => {
    const kindMatches = kind.value === 'all' || item.kind === kind.value;
    const text = [item.name, item.summary, item.publisher, ...item.tags]
      .join(' ')
      .toLocaleLowerCase();
    return kindMatches && (!needle || text.includes(needle));
  });
});

function clearFilters() {
  query.value = '';
  kind.value = 'all';
}
</script>
