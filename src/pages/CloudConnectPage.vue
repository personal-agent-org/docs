<template>
  <q-page class="solution-page cloud-connect-page">
    <section class="solution-hero page-width">
      <div class="solution-hero-copy">
        <div class="solution-label-row">
          <span class="eyebrow">{{ t('cloudConnect.eyebrow') }}</span>
          <span class="status-pill">{{ t('cloudConnect.status') }}</span>
        </div>
        <h1>{{ t('cloudConnect.title') }}</h1>
        <p class="hero-lead">{{ t('cloudConnect.lead') }}</p>
        <div class="hero-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('cloudConnect.primary')"
            href="mailto:cloud-connect@example.com"
            icon-right="mail"
          />
          <q-btn
            flat
            no-caps
            :label="t('cloudConnect.selfHost')"
            to="/docs/getting-started/"
            icon-right="arrow_forward"
          />
        </div>
      </div>
      <div class="connect-visual" aria-hidden="true">
        <div class="connect-home"><q-icon name="home" /><span>Personal Agent</span></div>
        <div class="connect-path"><i></i><span>Cloud Connect</span><i></i></div>
        <div class="connect-clients">
          <q-icon name="laptop_mac" /><q-icon name="smartphone" /><q-icon name="terminal" />
        </div>
      </div>
    </section>

    <section class="solution-section solution-section-muted">
      <div class="page-width">
        <div class="solution-heading">
          <span class="eyebrow">{{ t('cloudConnect.promiseLabel') }}</span>
          <h2>{{ t('cloudConnect.promiseTitle') }}</h2>
          <p>{{ t('cloudConnect.promiseCopy') }}</p>
        </div>
        <div class="solution-feature-grid">
          <article v-for="feature in features" :key="feature.title" class="solution-feature-card">
            <q-icon :name="feature.icon" />
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.copy }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="offer-crosslink page-width">
      <div>
        <p>{{ t('cloudConnect.distinction') }}</p>
        <router-link :to="localePath('/cloud')"
          >{{ t('cloudConnect.hostedLink') }} <q-icon name="arrow_forward"
        /></router-link>
      </div>
      <small>{{ t('cloudConnect.note') }}</small>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocalePath } from '@/composables/useLocalePath';
import { useSeo } from '@/composables/useSeo';

const { t } = useI18n();
const localePath = useLocalePath();
useSeo({
  title: () => t('cloudConnect.meta'),
  description: () => t('cloudConnect.seoDescription'),
  localized: true,
});
const features = computed(() => [
  {
    icon: 'shield_lock',
    title: t('cloudConnect.features.accessTitle'),
    copy: t('cloudConnect.features.accessCopy'),
  },
  {
    icon: 'devices',
    title: t('cloudConnect.features.discoveryTitle'),
    copy: t('cloudConnect.features.discoveryCopy'),
  },
  {
    icon: 'notifications_active',
    title: t('cloudConnect.features.pushTitle'),
    copy: t('cloudConnect.features.pushCopy'),
  },
  {
    icon: 'key',
    title: t('cloudConnect.features.controlTitle'),
    copy: t('cloudConnect.features.controlCopy'),
  },
]);
</script>
