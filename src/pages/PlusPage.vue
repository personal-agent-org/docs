<template>
  <q-page class="solution-page plus-page">
    <section class="solution-hero page-width">
      <div class="solution-hero-copy">
        <div class="solution-label-row">
          <span class="eyebrow">{{ t('plus.eyebrow') }}</span>
          <span class="status-pill">{{ t('plus.status') }}</span>
        </div>
        <h1>{{ t('plus.title') }}</h1>
        <p class="hero-lead">{{ t('plus.lead') }}</p>
        <div class="plus-price-line">
          <strong>{{ t('plus.price') }}</strong>
          <span>{{ t('plus.priceNote') }}</span>
        </div>
        <div class="hero-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('plus.primary')"
            href="mailto:hello@personal-agent.org?subject=Personal%20Agent%2B"
            icon-right="mail"
          />
          <q-btn
            flat
            no-caps
            :label="t('plus.selfHost')"
            to="/docs/getting-started/"
            icon-right="arrow_forward"
          />
        </div>
      </div>
      <div class="connect-visual" aria-hidden="true">
        <div class="connect-home"><q-icon name="home" /><span>Personal Agent</span></div>
        <div class="connect-path"><i></i><span>Personal Agent+</span><i></i></div>
        <div class="connect-clients">
          <q-icon name="laptop_mac" /><q-icon name="smartphone" /><q-icon name="terminal" />
        </div>
      </div>
    </section>

    <section class="solution-section solution-section-muted">
      <div class="page-width">
        <div class="solution-heading">
          <span class="eyebrow">{{ t('plus.promiseLabel') }}</span>
          <h2>{{ t('plus.promiseTitle') }}</h2>
          <p>{{ t('plus.promiseCopy') }}</p>
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

    <section class="solution-section page-width plus-principles">
      <div class="solution-heading">
        <span class="eyebrow">{{ t('plus.foundationLabel') }}</span>
        <h2>{{ t('plus.foundationTitle') }}</h2>
        <p>{{ t('plus.foundationCopy') }}</p>
      </div>
      <div class="plus-principle-grid">
        <article>
          <q-icon name="notifications_active" />
          <div>
            <h3>{{ t('plus.freePushTitle') }}</h3>
            <p>{{ t('plus.freePushCopy') }}</p>
          </div>
        </article>
        <article>
          <q-icon name="lock" />
          <div>
            <h3>{{ t('plus.privateTitle') }}</h3>
            <p>{{ t('plus.privateCopy') }}</p>
          </div>
        </article>
        <article>
          <q-icon name="code" />
          <div>
            <h3>{{ t('plus.openTitle') }}</h3>
            <p>{{ t('plus.openCopy') }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="solution-section solution-section-muted plus-support-section">
      <div class="page-width plus-support-grid">
        <div>
          <span class="eyebrow">{{ t('plus.supportLabel') }}</span>
          <h2>{{ t('plus.supportTitle') }}</h2>
          <p>{{ t('plus.supportCopy') }}</p>
          <p>{{ t('plus.supportSustainability') }}</p>
        </div>
        <aside class="plus-price-card">
          <span>Personal Agent+</span>
          <strong>{{ t('plus.price') }}</strong>
          <small>{{ t('plus.priceNote') }}</small>
          <q-separator dark />
          <p><q-icon name="check" /> {{ t('plus.cancel') }}</p>
          <p><q-icon name="check" /> {{ t('plus.supportIncluded') }}</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('plus.primary')"
            href="mailto:hello@personal-agent.org?subject=Personal%20Agent%2B"
            icon-right="mail"
          />
        </aside>
      </div>
    </section>

    <section class="offer-crosslink page-width">
      <div>
        <p>{{ t('plus.distinction') }}</p>
        <router-link :to="localePath('/cloud')"
          >{{ t('plus.hostedLink') }} <q-icon name="arrow_forward"
        /></router-link>
      </div>
      <small>{{ t('plus.note') }}</small>
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
  title: () => t('plus.meta'),
  description: () => t('plus.seoDescription'),
  localized: true,
});
const features = computed(() => [
  {
    icon: 'shield_lock',
    title: t('plus.features.accessTitle'),
    copy: t('plus.features.accessCopy'),
  },
  {
    icon: 'settings_backup_restore',
    title: t('plus.features.backupTitle'),
    copy: t('plus.features.backupCopy'),
  },
  {
    icon: 'webhook',
    title: t('plus.features.eventsTitle'),
    copy: t('plus.features.eventsCopy'),
  },
  {
    icon: 'record_voice_over',
    title: t('plus.features.voiceTitle'),
    copy: t('plus.features.voiceCopy'),
  },
  {
    icon: 'video_call',
    title: t('plus.features.realtimeTitle'),
    copy: t('plus.features.realtimeCopy'),
  },
  {
    icon: 'devices',
    title: t('plus.features.discoveryTitle'),
    copy: t('plus.features.discoveryCopy'),
  },
]);
</script>
