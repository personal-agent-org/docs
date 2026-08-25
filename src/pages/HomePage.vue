<template>
  <q-page>
    <section class="hero page-width">
      <div class="hero-copy">
        <div class="announcement"><span>Open source</span> Built around your context, not ours</div>
        <h1>Your agents.<br /><span>Your world.</span></h1>
        <p class="hero-lead">
          A self-hostable home for AI that understands your tools and data, works proactively, and
          stays under your control.
        </p>
        <div class="hero-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            label="Get started"
            to="/docs/getting-started/"
            icon-right="arrow_forward"
          />
          <q-btn
            outline
            no-caps
            color="primary"
            label="Explore the marketplace"
            to="/marketplace"
          />
        </div>
        <div class="trust-row">
          <span><q-icon name="lock" /> Private by design</span>
          <span><q-icon name="code" /> Self-hostable</span>
          <span><q-icon name="hub" /> Built to connect</span>
        </div>
      </div>

      <div
        class="hero-orbit"
        aria-label="Personal Agent connects agents, skills, integrations, and your data"
      >
        <div class="orbit-ring orbit-one"></div>
        <div class="orbit-ring orbit-two"></div>
        <div class="core-node"><span>pa</span><small>your agent</small></div>
        <div class="orbit-node node-agent"><q-icon name="smart_toy" /><span>Agents</span></div>
        <div class="orbit-node node-skill"><q-icon name="auto_awesome" /><span>Skills</span></div>
        <div class="orbit-node node-integration">
          <q-icon name="extension" /><span>Integrations</span>
        </div>
        <div class="orbit-node node-data"><q-icon name="database" /><span>Your data</span></div>
      </div>
    </section>

    <section id="product" class="section page-width">
      <div class="section-heading">
        <span class="eyebrow">One personal system</span>
        <h2>Useful because it knows how your world fits together.</h2>
        <p>
          Personal Agent combines conversation, durable work, integrations, and governed memory in
          one open platform.
        </p>
      </div>
      <div class="feature-grid">
        <article v-for="feature in features" :key="feature.title" class="feature-card">
          <q-icon :name="feature.icon" size="30px" />
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.copy }}</p>
        </article>
      </div>
    </section>

    <section class="market-preview">
      <div class="page-width">
        <div class="section-heading row-heading">
          <div>
            <span class="eyebrow">Marketplace</span>
            <h2>Add expertise without rebuilding it.</h2>
          </div>
          <q-btn
            flat
            no-caps
            color="primary"
            label="Browse everything"
            to="/marketplace"
            icon-right="arrow_forward"
          />
        </div>
        <div class="market-grid">
          <MarketplaceCard v-for="item in featuredItems" :key="item.slug" :item="item" />
        </div>
      </div>
    </section>

    <section class="cta page-width">
      <div>
        <span class="eyebrow">Own the whole stack</span>
        <h2>Start with a chat. Grow into an operating system for your digital life.</h2>
      </div>
      <q-btn
        unelevated
        no-caps
        color="secondary"
        text-color="dark"
        label="Read the documentation"
        to="/docs/getting-started/"
        icon-right="arrow_forward"
      />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';
import MarketplaceCard from '@/components/MarketplaceCard.vue';
import { listMarketplaceItems } from '@/services/marketplace';
import type { MarketplaceItem } from '@/types/marketplace';

useMeta({ title: 'Personal Agent' });

const features = [
  {
    icon: 'forum',
    title: 'A real conversation layer',
    copy: 'Chat naturally across web, desktop, and terminal while every surface shares the same governed context.',
  },
  {
    icon: 'psychology',
    title: 'Memory with provenance',
    copy: 'Facts, entities, and changes form a causal world-state graph instead of disappearing into a flat transcript.',
  },
  {
    icon: 'schedule',
    title: 'Work that keeps going',
    copy: 'Agents and workflows run durably, ask for approval when needed, and return to the conversation with results.',
  },
  {
    icon: 'security',
    title: 'Control stays with you',
    copy: 'Self-hosting, scoped credentials, data classification, and explicit tool policy are part of the architecture.',
  },
];

const featuredItems: MarketplaceItem[] = listMarketplaceItems()
  .filter((item) => item.featured)
  .slice(0, 3);
</script>
