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
        <span class="eyebrow">{{ t('organizations.servicesLabel') }}</span>
        <h2>{{ t('organizations.servicesTitle') }}</h2>
        <p>{{ t('organizations.servicesCopy') }}</p>
      </div>
      <div class="solution-feature-grid organization-service-grid">
        <article v-for="service in services" :key="service.title" class="solution-feature-card">
          <q-icon :name="service.icon" />
          <h3>{{ service.title }}</h3>
          <p>{{ service.copy }}</p>
        </article>
      </div>
    </section>

    <section class="solution-section solution-section-muted">
      <div class="page-width">
        <div class="solution-heading">
          <span class="eyebrow">{{ t('organizations.enterpriseLabel') }}</span>
          <h2>{{ t('organizations.enterpriseTitle') }}</h2>
          <p>{{ t('organizations.enterpriseCopy') }}</p>
        </div>
        <div class="solution-feature-grid organization-enterprise-grid">
          <article
            v-for="feature in enterpriseFeatures"
            :key="feature.title"
            class="solution-feature-card"
          >
            <q-icon :name="feature.icon" />
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.copy }}</p>
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

const services = computed(() => [
  {
    icon: 'architecture',
    title: t('organizations.services.consultingTitle'),
    copy: t('organizations.services.consultingCopy'),
  },
  {
    icon: 'support_agent',
    title: t('organizations.services.supportTitle'),
    copy: t('organizations.services.supportCopy'),
  },
  {
    icon: 'code',
    title: t('organizations.services.customTitle'),
    copy: t('organizations.services.customCopy'),
  },
]);

const enterpriseFeatures = computed(() => [
  {
    icon: 'login',
    title: t('organizations.enterprise.oidcTitle'),
    copy: t('organizations.enterprise.oidcCopy'),
  },
  {
    icon: 'admin_panel_settings',
    title: t('organizations.enterprise.rolesTitle'),
    copy: t('organizations.enterprise.rolesCopy'),
  },
  {
    icon: 'rule',
    title: t('organizations.enterprise.policyTitle'),
    copy: t('organizations.enterprise.policyCopy'),
  },
  {
    icon: 'fact_check',
    title: t('organizations.enterprise.auditTitle'),
    copy: t('organizations.enterprise.auditCopy'),
  },
  {
    icon: 'cloud_done',
    title: t('organizations.enterprise.deploymentTitle'),
    copy: t('organizations.enterprise.deploymentCopy'),
  },
  {
    icon: 'published_with_changes',
    title: t('organizations.enterprise.lifecycleTitle'),
    copy: t('organizations.enterprise.lifecycleCopy'),
  },
  {
    icon: 'account_balance_wallet',
    title: t('organizations.enterprise.budgetsTitle'),
    copy: t('organizations.enterprise.budgetsCopy'),
  },
  {
    icon: 'swap_horiz',
    title: t('organizations.enterprise.providersTitle'),
    copy: t('organizations.enterprise.providersCopy'),
  },
  {
    icon: 'diversity_3',
    title: t('organizations.enterprise.ecosystemTitle'),
    copy: t('organizations.enterprise.ecosystemCopy'),
  },
]);
</script>
