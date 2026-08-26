<template>
  <q-page class="solution-page hosted-cloud-page">
    <section class="solution-hero page-width">
      <div class="solution-hero-copy">
        <div class="solution-label-row">
          <span class="eyebrow">{{ t('hosted.eyebrow') }}</span>
          <span class="status-pill">{{ t('hosted.status') }}</span>
        </div>
        <h1>{{ t('hosted.title') }}</h1>
        <p class="hero-lead">{{ t('hosted.lead') }}</p>
        <div class="hero-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('hosted.primary')"
            href="mailto:cloud@example.com"
            icon-right="mail"
          />
          <q-btn
            flat
            no-caps
            :label="t('hosted.compare')"
            :to="localePath('/plus')"
            icon-right="arrow_forward"
          />
        </div>
      </div>
      <div class="hosted-visual" aria-hidden="true">
        <div class="hosted-cloud">
          <q-icon name="cloud" /><strong>Personal Agent</strong><span>managed</span>
        </div>
        <div class="hosted-service service-monitor"><q-icon name="monitor_heart" /></div>
        <div class="hosted-service service-backup"><q-icon name="settings_backup_restore" /></div>
        <div class="hosted-service service-update"><q-icon name="system_update_alt" /></div>
      </div>
    </section>

    <section class="solution-section solution-section-muted">
      <div class="page-width">
        <div class="solution-heading">
          <span class="eyebrow">{{ t('hosted.valueLabel') }}</span>
          <h2>{{ t('hosted.valueTitle') }}</h2>
          <p>{{ t('hosted.valueCopy') }}</p>
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

    <section class="solution-section page-width">
      <div class="solution-heading">
        <h2>{{ t('hosted.audienceTitle') }}</h2>
      </div>
      <div class="offer-comparison">
        <article>
          <q-icon name="home_work" />
          <h3>{{ t('hosted.selfTitle') }}</h3>
          <p>{{ t('hosted.selfCopy') }}</p>
          <router-link :to="localePath('/plus')"
            >Personal Agent+ <q-icon name="arrow_forward"
          /></router-link>
        </article>
        <article class="selected">
          <q-icon name="cloud" />
          <h3>{{ t('hosted.hostedTitle') }}</h3>
          <p>{{ t('hosted.hostedCopy') }}</p>
        </article>
      </div>
      <p class="offer-note">{{ t('hosted.note') }}</p>
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
  title: () => t('hosted.meta'),
  description: () => t('hosted.seoDescription'),
  localized: true,
});
const features = computed(() => [
  {
    icon: 'monitor_heart',
    title: t('hosted.features.managedTitle'),
    copy: t('hosted.features.managedCopy'),
  },
  {
    icon: 'shield',
    title: t('hosted.features.privateTitle'),
    copy: t('hosted.features.privateCopy'),
  },
  { icon: 'devices', title: t('hosted.features.appsTitle'), copy: t('hosted.features.appsCopy') },
  {
    icon: 'move_up',
    title: t('hosted.features.portabilityTitle'),
    copy: t('hosted.features.portabilityCopy'),
  },
  {
    icon: 'add_circle',
    title: t('hosted.features.plusIncludedTitle'),
    copy: t('hosted.features.plusIncludedCopy'),
  },
]);
</script>
