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
          <div v-if="item.security_status === 'clean'" class="row items-center q-gutter-sm q-mb-md">
            <q-icon name="verified_user" color="positive" />
            <span>{{ t('marketplace.security.clean') }}</span>
          </div>
          <div v-else class="row items-center q-gutter-sm q-mb-md text-warning">
            <q-icon name="policy" />
            <span>{{ t('marketplace.security.pending') }}</span>
          </div>
          <template v-if="item.kind === 'integration'">
            <div v-if="item.quality_tier" class="quality-detail">
              <span>{{ qualityIcon(item.quality_tier) }}</span>
              <div>
                <strong>{{ t(`marketplace.quality.${item.quality_tier}`) }}</strong>
                <p>{{ t('marketplace.quality.reviewed') }}</p>
              </div>
            </div>
            <p v-else>{{ t('marketplace.quality.unrated') }}</p>
          </template>
          <q-separator dark />
          <p class="install-note">{{ t('marketplace.installNote') }}</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('marketplace.install')"
            :href="marketplaceInstallUrl(item.slug)"
            :disable="item.security_status !== 'clean'"
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
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLocalePath } from '@/composables/useLocalePath';
import { useSeo } from '@/composables/useSeo';
import {
  fetchMarketplaceItem,
  getMarketplaceItem,
  marketplaceInstallUrl,
} from '@/services/marketplace';
import type { MarketplaceItem, QualityTier } from '@/types/marketplace';

const route = useRoute();
const { t } = useI18n();
const localePath = useLocalePath();
const remoteItem = ref<MarketplaceItem>();
const item = computed<MarketplaceItem | undefined>(
  () => remoteItem.value ?? getMarketplaceItem(String(route.params.slug)),
);
onMounted(async () => {
  try {
    remoteItem.value = await fetchMarketplaceItem(String(route.params.slug));
  } catch {
    // Keep the pre-rendered detail available during a platform API outage.
  }
});
useSeo({
  title: () => item.value?.name ?? t('marketplace.notFound'),
  description: () => item.value?.summary ?? t('marketplace.notFound'),
  localized: true,
});

function qualityIcon(tier: QualityTier): string {
  return { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '🏆' }[tier];
}
</script>
