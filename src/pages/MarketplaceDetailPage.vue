<template>
  <q-page class="page-width detail-page">
    <template v-if="item">
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back"
        :label="t('marketplace.title')"
        :to="localePath('/marketplace')"
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
          <h2>{{ t('marketplace.what') }}</h2>
          <p class="detail-copy">{{ item.description }}</p>
          <h2>{{ t('marketplace.capabilities') }}</h2>
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
          <p>{{ t('marketplace.preview') }}</p>
          <q-separator dark />
          <p class="install-note">{{ t('marketplace.installNote') }}</p>
          <q-btn
            disable
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('marketplace.install')"
            class="full-width"
          />
        </aside>
      </div>
    </template>
    <div v-else class="empty-state">
      <h1>{{ t('marketplace.notFound') }}</h1>
      <q-btn flat color="primary" :to="localePath('/marketplace')" :label="t('marketplace.back')" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLocalePath } from '@/composables/useLocalePath';
import { useSeo } from '@/composables/useSeo';
import { getMarketplaceItem } from '@/services/marketplace';
import type { MarketplaceItem } from '@/types/marketplace';

const route = useRoute();
const { t } = useI18n();
const localePath = useLocalePath();
const item = computed<MarketplaceItem | undefined>(() =>
  getMarketplaceItem(String(route.params.slug)),
);
useSeo({
  title: () => item.value?.name ?? t('marketplace.notFound'),
  description: () => item.value?.summary ?? t('marketplace.notFound'),
  localized: true,
});
</script>
