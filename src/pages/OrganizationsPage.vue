<template>
  <q-page class="solution-page organizations-page">
    <section class="solution-hero page-width">
      <div class="solution-hero-copy">
        <span class="eyebrow">{{ t('organizations.eyebrow') }}</span>
        <h1>{{ t('organizations.title') }}</h1>
        <p class="hero-lead">{{ t('organizations.lead') }}</p>
        <div class="hero-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('organizations.contact')"
            href="#contact"
            icon-right="arrow_downward"
          />
          <q-btn
            flat
            no-caps
            :label="t('organizations.explore')"
            :to="`${localePath('/')}#explore`"
            icon-right="arrow_forward"
          />
        </div>
      </div>
      <div class="organization-visual" aria-hidden="true">
        <div class="organization-core">
          <q-icon name="corporate_fare" /><span>Personal Agent</span>
        </div>
        <div class="organization-orbit orbit-identity">
          <q-icon name="badge" /><span>Identity</span>
        </div>
        <div class="organization-orbit orbit-policy">
          <q-icon name="policy" /><span>Policy</span>
        </div>
        <div class="organization-orbit orbit-data"><q-icon name="database" /><span>Data</span></div>
        <div class="organization-orbit orbit-tools">
          <q-icon name="extension" /><span>Tools</span>
        </div>
      </div>
    </section>

    <section class="solution-section solution-section-muted">
      <div class="page-width">
        <div class="solution-heading">
          <span class="eyebrow">{{ t('organizations.trustLabel') }}</span>
          <h2>{{ t('organizations.trustTitle') }}</h2>
          <p>{{ t('organizations.trustCopy') }}</p>
        </div>
        <div class="solution-feature-grid">
          <article v-for="pillar in pillars" :key="pillar.title" class="solution-feature-card">
            <q-icon :name="pillar.icon" />
            <h3>{{ pillar.title }}</h3>
            <p>{{ pillar.copy }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="solution-section page-width">
      <div class="solution-heading">
        <span class="eyebrow">{{ t('organizations.sectorsLabel') }}</span>
        <h2>{{ t('organizations.sectorsTitle') }}</h2>
      </div>
      <div class="sector-grid">
        <article>
          <div class="sector-icon"><q-icon name="apartment" /></div>
          <h3>{{ t('organizations.businessTitle') }}</h3>
          <p>{{ t('organizations.businessCopy') }}</p>
        </article>
        <article>
          <div class="sector-icon"><q-icon name="account_balance" /></div>
          <h3>{{ t('organizations.publicTitle') }}</h3>
          <p>{{ t('organizations.publicCopy') }}</p>
        </article>
      </div>
    </section>

    <section id="contact" class="contact-section page-width">
      <div>
        <span class="eyebrow">{{ t('organizations.contact') }}</span>
        <h2>{{ t('organizations.partnershipTitle') }}</h2>
        <p>{{ t('organizations.partnershipCopy') }}</p>
      </div>
      <div class="contact-card">
        <span class="placeholder-label">{{ t('organizations.placeholder') }}</span>
        <a href="mailto:business@example.com">
          <q-icon name="mail" />
          <span
            ><small>{{ t('organizations.email') }}</small
            ><strong>business@example.com</strong></span
          >
        </a>
        <a href="tel:+490000000000">
          <q-icon name="call" />
          <span
            ><small>{{ t('organizations.phone') }}</small
            ><strong>+49 000 00000000</strong></span
          >
        </a>
        <p>{{ t('organizations.response') }}</p>
      </div>
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
  title: () => t('organizations.meta'),
  description: () => t('organizations.seoDescription'),
  localized: true,
});

const pillars = computed(() => [
  {
    icon: 'dns',
    title: t('organizations.pillars.controlTitle'),
    copy: t('organizations.pillars.controlCopy'),
  },
  {
    icon: 'manage_accounts',
    title: t('organizations.pillars.identityTitle'),
    copy: t('organizations.pillars.identityCopy'),
  },
  {
    icon: 'verified_user',
    title: t('organizations.pillars.governanceTitle'),
    copy: t('organizations.pillars.governanceCopy'),
  },
  {
    icon: 'hub',
    title: t('organizations.pillars.extensibilityTitle'),
    copy: t('organizations.pillars.extensibilityCopy'),
  },
]);
</script>
