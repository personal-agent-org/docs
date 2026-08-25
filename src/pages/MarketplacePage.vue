<template>
  <q-page class="page-width marketplace-page">
    <header class="page-hero compact">
      <span class="eyebrow">Marketplace</span>
      <h1>Marketplace</h1>
      <p>
        Browse agents, skills, integrations, and workflows. Adopted items run in your context with
        your data classification, integrations, model, and governance.
      </p>
    </header>

    <div class="catalog-controls">
      <q-input
        v-model="query"
        dark
        outlined
        rounded
        clearable
        debounce="100"
        placeholder="Search the marketplace"
        aria-label="Search marketplace"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <div class="filter-row" role="group" aria-label="Filter by type">
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
      {{ filteredItems.length }} {{ filteredItems.length === 1 ? 'item' : 'items' }}
    </div>
    <div v-if="filteredItems.length" class="market-grid">
      <MarketplaceCard v-for="item in filteredItems" :key="item.slug" :item="item" />
    </div>
    <div v-else class="empty-state">
      <q-icon name="search_off" size="42px" />
      <h2>No matching items</h2>
      <p>Try another term or reset the type filter.</p>
      <q-btn flat no-caps color="primary" label="Clear filters" @click="clearFilters" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMeta } from 'quasar';
import MarketplaceCard from '@/components/MarketplaceCard.vue';
import { listMarketplaceItems } from '@/services/marketplace';
import type { MarketplaceItem, MarketplaceKind } from '@/types/marketplace';

useMeta({ title: 'Marketplace' });

type KindFilter = 'all' | MarketplaceKind;
const filters: { label: string; value: KindFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Agents', value: 'agent' },
  { label: 'Skills', value: 'skill' },
  { label: 'Integrations', value: 'integration' },
  { label: 'Workflows', value: 'workflow' },
];
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
