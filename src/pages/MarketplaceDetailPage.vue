<template>
  <q-page class="page-width detail-page">
    <template v-if="item">
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back"
        label="Marketplace"
        to="/marketplace"
        class="back-link"
      />
      <div class="detail-grid">
        <main>
          <div class="detail-icon"><q-icon :name="item.icon" /></div>
          <div class="eyebrow">{{ item.kind }}</div>
          <h1>{{ item.name }}</h1>
          <p class="hero-lead">{{ item.summary }}</p>
          <div class="tag-row q-my-lg">
            <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <h2>What it does</h2>
          <p class="detail-copy">{{ item.description }}</p>
          <h2>Requested capabilities</h2>
          <ul class="capability-list">
            <li v-for="capability in item.capabilities" :key="capability">
              <q-icon name="check_circle" color="secondary" />{{ capability }}
            </li>
          </ul>
        </main>
        <aside class="install-panel">
          <div class="row items-center q-gutter-sm">
            <strong>{{ item.publisher }}</strong
            ><q-icon v-if="item.verified" name="verified" color="secondary" />
          </div>
          <p>Catalog preview</p>
          <q-separator dark />
          <p class="install-note">
            Installation will connect to your Personal Agent instance and always show the exact
            permissions before adoption.
          </p>
          <q-btn
            disable
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            label="Install from your instance"
            class="full-width"
          />
        </aside>
      </div>
    </template>
    <div v-else class="empty-state">
      <h1>Marketplace item not found</h1>
      <q-btn flat color="primary" to="/marketplace" label="Back to marketplace" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMeta } from 'quasar';
import { useRoute } from 'vue-router';
import { getMarketplaceItem } from '@/services/marketplace';
import type { MarketplaceItem } from '@/types/marketplace';

const route = useRoute();
const item = computed<MarketplaceItem | undefined>(() =>
  getMarketplaceItem(String(route.params.slug)),
);
useMeta(() => ({ title: item.value?.name ?? 'Marketplace item' }));
</script>
