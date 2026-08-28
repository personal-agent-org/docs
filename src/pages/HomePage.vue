<template>
  <q-page class="home-page">
    <section class="hero page-width">
      <div class="hero-copy">
        <div class="hero-kicker"><span></span> {{ t('home.kicker') }}</div>
        <h1>
          {{ t('home.title') }}<br /><em>{{ t('home.titleAccent') }}</em>
        </h1>
        <p class="hero-lead">{{ t('home.lead') }}</p>
        <div class="hero-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('home.getStarted')"
            to="/docs/getting-started/"
            icon-right="arrow_forward"
          />
          <q-btn
            flat
            no-caps
            :label="t('home.viewGithub')"
            href="https://github.com/personal-agent-org"
            target="_blank"
            icon-right="north_east"
          />
        </div>
      </div>

      <div class="product-frame" :aria-label="t('home.preview')">
        <div class="product-topbar">
          <SiteIcon name="menu" />
          <div class="product-brand">
            <img :src="markDarkUrl" alt="" /><span>Personal Agent</span>
          </div>
          <span class="product-more">•••</span>
        </div>
        <div class="product-body">
          <aside class="product-drawer">
            <div class="drawer-item active">
              <SiteIcon name="home" /><span>{{ t('home.mainChat') }}</span>
            </div>
            <div class="drawer-item">
              <SiteIcon name="inbox" /><span>{{ t('home.inbox') }}</span>
            </div>
            <div class="drawer-item">
              <SiteIcon name="calendar" /><span>{{ t('home.agenda') }}</span>
            </div>
            <div class="drawer-item">
              <SiteIcon name="folder" /><span>{{ t('home.files') }}</span>
            </div>
            <div class="drawer-item">
              <SiteIcon name="chat" /><span>{{ t('home.sessions') }}</span>
            </div>
            <div class="drawer-new">
              <SiteIcon name="plus" /><span>{{ t('home.newSession') }}</span>
            </div>
            <div class="drawer-label">{{ t('home.recentActivity') }}</div>
            <div class="drawer-empty">{{ t('home.noSessions') }}</div>
            <div class="drawer-profile"><i>PA</i><span>user@example.com</span></div>
          </aside>
          <div class="product-chat">
            <div class="chat-center">
              <div class="chat-greeting">{{ t('home.greeting') }}</div>
              <div class="real-composer">
                <div class="composer-placeholder">{{ t('home.message') }}</div>
                <div class="composer-controls">
                  <span>{{ t('home.auto') }} <b>⌄</b></span
                  ><span>{{ t('home.integrations') }} <b>⌄</b></span
                  ><i></i>
                  <button aria-hidden="true"><SiteIcon name="plus" /></button>
                  <button class="send-button" aria-hidden="true"><SiteIcon name="send" /></button>
                </div>
              </div>
              <div class="mode-cards">
                <div class="mode-card selected">
                  <SiteIcon name="chat" /><span
                    ><strong>{{ t('home.standard') }}</strong
                    ><small>{{ t('home.normalChat') }}</small></span
                  >
                </div>
                <div class="mode-card">
                  <SiteIcon name="code" /><span
                    ><strong>{{ t('home.coding') }}</strong
                    ><small>{{ t('home.codingHint') }}</small></span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="principles-strip">
      <div class="page-width">
        <span v-for="principle in principles" :key="principle.label">
          <SiteIcon :name="principle.icon" /> {{ principle.label }}
        </span>
      </div>
    </section>

    <section id="about" class="clients-section section page-width">
      <div class="clients-heading">
        <div>
          <span class="section-index">{{ t('home.clients.eyebrow') }}</span>
          <h2>{{ t('home.clients.title') }}</h2>
        </div>
        <p>{{ t('home.clients.copy') }}</p>
      </div>
      <div class="client-grid">
        <article
          v-for="client in clients"
          :key="client.title"
          class="client-card"
          :class="{ 'client-card-featured': client.featured }"
        >
          <div class="client-card-top">
            <span>{{ client.number }}</span>
            <q-icon :name="client.icon" />
          </div>
          <div>
            <h3>{{ client.title }}</h3>
            <p>{{ client.copy }}</p>
          </div>
          <div v-if="client.featured" class="voice-wave" aria-hidden="true">
            <i v-for="index in 13" :key="index"></i>
          </div>
          <div class="client-card-actions">
            <router-link class="client-card-meta" :to="client.to">
              <span>{{ client.meta }}</span>
              <q-icon name="arrow_outward" />
            </router-link>
            <a
              v-if="client.actionHref"
              class="client-download"
              :href="client.actionHref"
              :target="client.actionTarget"
              :rel="client.actionTarget ? 'noopener noreferrer' : undefined"
            >
              <q-icon :name="client.actionIcon" />
              {{ client.actionLabel }}
            </a>
          </div>
        </article>
      </div>
    </section>

    <section id="trust" class="trust-section">
      <div class="page-width trust-layout">
        <div class="trust-copy">
          <span class="section-index">{{ t('home.trust.eyebrow') }}</span>
          <h2>{{ t('home.trust.title') }}</h2>
          <p>{{ t('home.trust.copy') }}</p>
          <router-link class="text-link" to="/docs/features/security/">
            {{ t('home.trust.link') }} <q-icon name="arrow_forward" />
          </router-link>

          <div class="trust-assurances">
            <div v-for="assurance in trustAssurances" :key="assurance.title">
              <q-icon :name="assurance.icon" />
              <span>
                <strong>{{ assurance.title }}</strong>
                <small>{{ assurance.copy }}</small>
              </span>
            </div>
          </div>
        </div>

        <div class="trust-model" :aria-label="t('home.trust.modelLabel')">
          <div class="trust-boundary-label">
            <span><i></i>{{ t('home.trust.boundary') }}</span>
            <strong>{{ t('home.trust.localFirst') }}</strong>
          </div>
          <div class="trust-core">
            <q-icon name="dns" />
            <div>
              <small>{{ t('home.trust.systemOfRecord') }}</small>
              <strong>Personal Agent</strong>
              <span>{{ t('home.trust.coreData') }}</span>
            </div>
          </div>
          <div class="trust-inputs">
            <span>{{ t('home.trust.dataClass') }}</span>
            <i>+</i>
            <span>{{ t('home.trust.orgFloor') }}</span>
            <i>+</i>
            <span>{{ t('home.trust.integrationTier') }}</span>
          </div>
          <div class="trust-connector">
            <i></i><span>{{ t('home.trust.requirement') }}</span>
          </div>
          <div class="trust-gate">
            <q-icon name="policy" />
            <div>
              <small>{{ t('home.trust.singleGate') }}</small>
              <strong>{{ t('home.trust.gateRule') }}</strong>
            </div>
            <span>{{ t('home.trust.failClosed') }}</span>
          </div>
          <div class="trust-connector trust-connector-out">
            <i></i><span>{{ t('home.trust.clearedOnly') }}</span>
          </div>
          <div class="provider-tiers">
            <div>
              <span>02</span><strong>{{ t('home.trust.internal') }}</strong
              ><small>{{ t('home.trust.internalHint') }}</small>
            </div>
            <div>
              <span>01</span><strong>{{ t('home.trust.regulated') }}</strong
              ><small>{{ t('home.trust.regulatedHint') }}</small>
            </div>
            <div>
              <span>00</span><strong>{{ t('home.trust.standard') }}</strong
              ><small>{{ t('home.trust.standardHint') }}</small>
            </div>
          </div>
          <div class="trust-blocked"><q-icon name="block" /> {{ t('home.trust.blocked') }}</div>
        </div>
      </div>
    </section>

    <section id="explore" class="section page-width">
      <div class="section-heading section-heading-split">
        <div>
          <span class="section-index">01</span>
          <h2>{{ t('home.section1Title') }}</h2>
        </div>
        <p>{{ t('home.section1Copy') }}</p>
      </div>
      <div class="feature-grid bento-grid">
        <router-link
          v-for="(feature, index) in primaryFeatures"
          :key="feature.title"
          class="feature-card bento-card"
          :class="`bento-${index + 1}`"
          :to="feature.to"
        >
          <div class="feature-icon"><q-icon :name="feature.icon" /></div>
          <div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.copy }}</p>
          </div>
          <q-icon name="arrow_outward" class="card-arrow" />
          <div v-if="index === 0" class="memory-visual" aria-hidden="true">
            <i></i><i></i><i></i><i></i><span></span><span></span><span></span>
          </div>
          <div v-if="index === 1" class="run-visual" aria-hidden="true">
            <span class="complete">{{ t('home.trigger') }}</span
            ><i></i><span class="current">{{ t('home.run') }}</span
            ><i></i><span>{{ t('home.result') }}</span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="architecture-section">
      <div class="page-width architecture-grid">
        <div class="architecture-copy">
          <span class="section-index">02</span>
          <h2 class="pre-line">{{ t('home.architectureTitle') }}</h2>
          <p>{{ t('home.architectureCopy') }}</p>
          <router-link class="text-link" to="/docs/architecture/"
            >{{ t('home.architectureLink') }} <q-icon name="arrow_forward"
          /></router-link>
        </div>
        <div class="architecture-flow" :aria-label="t('home.flowLabel')">
          <div class="flow-node">
            <small>01 · {{ t('home.context') }}</small
            ><strong>{{ t('home.chatWorld') }}</strong
            ><span>{{ t('home.contextDetail') }}</span>
          </div>
          <div class="flow-connector">
            <i></i><span>{{ t('home.classified') }}</span>
          </div>
          <div class="flow-node flow-primary">
            <small>02 · {{ t('home.governance') }}</small
            ><strong>{{ t('home.policyGate') }}</strong
            ><span>{{ t('home.policyDetail') }}</span>
          </div>
          <div class="flow-connector">
            <i></i><span>{{ t('home.approved') }}</span>
          </div>
          <div class="flow-split">
            <div class="flow-node">
              <small>03A · {{ t('home.inline') }}</small
              ><strong>{{ t('home.immediate') }}</strong>
            </div>
            <div class="flow-node">
              <small>03B · {{ t('home.durable') }}</small
              ><strong>{{ t('home.completion') }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section page-width">
      <div class="section-heading section-heading-split">
        <div>
          <span class="section-index">03</span>
          <h2>{{ t('home.marketplaceTitle') }}</h2>
        </div>
        <p>{{ t('home.marketplaceCopy') }}</p>
      </div>
      <div class="market-intro-grid">
        <router-link
          v-for="kind in marketplaceKinds"
          :key="kind.title"
          :to="localePath('/marketplace')"
          class="market-kind"
        >
          <span class="kind-number">{{ kind.number }}</span
          ><q-icon :name="kind.icon" />
          <h3>{{ kind.title }}</h3>
          <p>{{ kind.copy }}</p>
          <span class="kind-link"
            >{{ t('home.browse', { kind: kind.title.toLocaleLowerCase(locale) }) }}
            <q-icon name="arrow_forward"
          /></span>
        </router-link>
      </div>
    </section>

    <section class="closing-cta page-width">
      <picture
        ><source media="(prefers-color-scheme: dark)" :srcset="markDarkUrl" />
        <img :src="markUrl" alt="Personal Agent"
      /></picture>
      <div>
        <span class="section-index">{{ t('home.startHere') }}</span>
        <h2>{{ t('footer.slogan') }}</h2>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        :label="t('home.readDocs')"
        to="/docs/getting-started/"
        icon-right="arrow_forward"
      />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SiteIcon from '@/components/SiteIcon.vue';
import { useLocalePath } from '@/composables/useLocalePath';
import { useSeo } from '@/composables/useSeo';
import markUrl from '../../docs/assets/mark.svg?url';
import markDarkUrl from '../../docs/assets/mark-dark.svg?url';

const { t, locale } = useI18n();
const localePath = useLocalePath();
useSeo({
  title: () => t('home.meta'),
  description: () => t('home.seoDescription'),
  localized: true,
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Personal Agent',
      url: 'https://personal-agent.org/',
      logo: new URL(markUrl, 'https://personal-agent.org').href,
      sameAs: ['https://github.com/personal-agent-org'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Personal Agent',
      url: 'https://personal-agent.org/',
    },
  ],
});

const principles = computed(() => [
  { icon: 'lock', label: t('home.principles.private') },
  { icon: 'code', label: t('home.principles.open') },
  { icon: 'clock', label: t('home.principles.durable') },
  { icon: 'policy', label: t('home.principles.governance') },
]);

const primaryFeatures = computed(() => [
  {
    icon: 'hub',
    title: t('home.features.memoryTitle'),
    copy: t('home.features.memoryCopy'),
    to: '/docs/features/memory/',
  },
  {
    icon: 'route',
    title: t('home.features.durableTitle'),
    copy: t('home.features.durableCopy'),
    to: '/docs/features/workflows/',
  },
  {
    icon: 'forum',
    title: t('home.features.chatTitle'),
    copy: t('home.features.chatCopy'),
    to: '/docs/features/chat/',
  },
  {
    icon: 'extension',
    title: t('home.features.integrationsTitle'),
    copy: t('home.features.integrationsCopy'),
    to: '/docs/features/integrations/',
  },
  {
    icon: 'devices',
    title: t('home.features.devicesTitle'),
    copy: t('home.features.devicesCopy'),
    to: '/docs/features/devices/',
  },
  {
    icon: 'shield',
    title: t('home.features.securityTitle'),
    copy: t('home.features.securityCopy'),
    to: '/docs/features/security/',
  },
]);

const clients = computed(() => [
  {
    number: '01',
    icon: 'language',
    title: t('home.clients.webTitle'),
    copy: t('home.clients.webCopy'),
    meta: t('home.clients.webMeta'),
    to: '/docs/getting-started/',
    actionHref: 'https://demo.personal-agent.org',
    actionLabel: t('home.clients.openWeb'),
    actionIcon: 'open_in_new',
    actionTarget: '_blank',
  },
  {
    number: '02',
    icon: 'desktop_windows',
    title: t('home.clients.desktopTitle'),
    copy: t('home.clients.desktopCopy'),
    meta: t('home.clients.desktopMeta'),
    to: '/docs/getting-started/client-apps/#desktop-app-tauri',
    actionHref:
      'https://github.com/personal-agent-org/desktop/releases/latest/download/pagui-linux-x64.AppImage',
    actionLabel: t('home.clients.download'),
    actionIcon: 'download',
  },
  {
    number: '03',
    icon: 'terminal',
    title: t('home.clients.tuiTitle'),
    copy: t('home.clients.tuiCopy'),
    meta: t('home.clients.tuiMeta'),
    to: '/docs/getting-started/client-apps/#terminal-client-tui',
    actionHref: 'https://github.com/personal-agent-org/tui/releases/latest/download/pa-linux-x64',
    actionLabel: t('home.clients.download'),
    actionIcon: 'download',
  },
  {
    number: '04',
    icon: 'smartphone',
    title: t('home.clients.appTitle'),
    copy: t('home.clients.appCopy'),
    meta: t('home.clients.appMeta'),
    to: '/docs/getting-started/client-apps/#android-app',
    actionHref:
      'https://github.com/personal-agent-org/android/releases/latest/download/personal-agent.apk',
    actionLabel: t('home.clients.download'),
    actionIcon: 'download',
  },
  {
    number: '05',
    icon: 'graphic_eq',
    title: t('home.clients.voiceTitle'),
    copy: t('home.clients.voiceCopy'),
    meta: t('home.clients.voiceMeta'),
    to: '/docs/getting-started/client-apps/#voice-assistant-hardware',
    featured: true,
  },
]);

const trustAssurances = computed(() => [
  {
    icon: 'home_work',
    title: t('home.trust.assurances.localTitle'),
    copy: t('home.trust.assurances.localCopy'),
  },
  {
    icon: 'verified_user',
    title: t('home.trust.assurances.modelsTitle'),
    copy: t('home.trust.assurances.modelsCopy'),
  },
  {
    icon: 'lock_reset',
    title: t('home.trust.assurances.defaultTitle'),
    copy: t('home.trust.assurances.defaultCopy'),
  },
  {
    icon: 'device_hub',
    title: t('home.trust.assurances.scopedTitle'),
    copy: t('home.trust.assurances.scopedCopy'),
  },
]);

const marketplaceKinds = computed(() => [
  {
    number: '01',
    icon: 'smart_toy',
    title: t('home.kinds.agents'),
    copy: t('home.kinds.agentsCopy'),
  },
  {
    number: '02',
    icon: 'construction',
    title: t('home.kinds.skills'),
    copy: t('home.kinds.skillsCopy'),
  },
  {
    number: '03',
    icon: 'extension',
    title: t('home.kinds.integrations'),
    copy: t('home.kinds.integrationsCopy'),
  },
]);
</script>
