<template>
  <q-page class="home-page">
    <section class="hero page-width">
      <div class="hero-copy">
        <div class="hero-kicker"><span></span> Open source · self-hostable</div>
        <h1>Your world,<br /><em>handled.</em></h1>
        <p class="hero-lead">
          A self-hostable LLM chat &amp; agent platform on a durable runtime. Per-user agents use
          tools, browse your data, drive connected computers and browsers, run integrations, react
          to events, and act proactively on your behalf.
        </p>
        <div class="hero-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Get started"
            to="/docs/getting-started/"
            icon-right="arrow_forward"
          />
          <q-btn
            flat
            no-caps
            label="View on GitHub"
            href="https://github.com/personal-agent-org"
            target="_blank"
            icon-right="north_east"
          />
        </div>
      </div>

      <div class="product-frame" aria-label="Personal Agent product preview">
        <div class="product-topbar">
          <SiteIcon name="menu" />
          <div class="product-brand">
            <img :src="markDarkUrl" alt="" /><span>Personal Agent</span>
          </div>
          <span class="product-more">•••</span>
        </div>
        <div class="product-body">
          <aside class="product-drawer">
            <div class="drawer-item active"><SiteIcon name="home" /><span>Main chat</span></div>
            <div class="drawer-item"><SiteIcon name="inbox" /><span>Inbox</span></div>
            <div class="drawer-item"><SiteIcon name="calendar" /><span>Agenda</span></div>
            <div class="drawer-item"><SiteIcon name="folder" /><span>Files</span></div>
            <div class="drawer-item"><SiteIcon name="chat" /><span>Sessions</span></div>
            <div class="drawer-new"><SiteIcon name="plus" /><span>New session</span></div>
            <div class="drawer-label">Recent activity</div>
            <div class="drawer-empty">No sessions yet</div>
            <div class="drawer-profile"><i>PA</i><span>user@example.com</span></div>
          </aside>
          <div class="product-chat">
            <div class="chat-center">
              <div class="chat-greeting">Good to see you</div>
              <div class="real-composer">
                <div class="composer-placeholder">Send a message…</div>
                <div class="composer-controls">
                  <span>Auto <b>⌄</b></span
                  ><span>Integrations <b>⌄</b></span
                  ><i></i>
                  <button aria-hidden="true"><SiteIcon name="plus" /></button>
                  <button class="send-button" aria-hidden="true"><SiteIcon name="send" /></button>
                </div>
              </div>
              <div class="mode-cards">
                <div class="mode-card selected">
                  <SiteIcon name="chat" /><span
                    ><strong>Standard</strong><small>Normal chat</small></span
                  >
                </div>
                <div class="mode-card">
                  <SiteIcon name="code" /><span
                    ><strong>Coding</strong><small>Recommended for development</small></span
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

    <section id="explore" class="section page-width">
      <div class="section-heading section-heading-split">
        <div>
          <span class="section-index">01</span>
          <h2>One system for the work around you.</h2>
        </div>
        <p>
          Conversation is only the surface. Personal Agent connects memory, tools, durable execution
          and policy underneath it.
        </p>
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
            <span class="complete">Trigger</span><i></i><span class="current">Run</span><i></i
            ><span>Result</span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="architecture-section">
      <div class="page-width architecture-grid">
        <div class="architecture-copy">
          <span class="section-index">02</span>
          <h2>Powerful by design.<br />Controlled by default.</h2>
          <p>
            Every request passes through the same governed path, whether it runs inline or continues
            durably in the background.
          </p>
          <router-link class="text-link" to="/docs/architecture/"
            >Explore the architecture <q-icon name="arrow_forward"
          /></router-link>
        </div>
        <div class="architecture-flow" aria-label="Request processing flow">
          <div class="flow-node">
            <small>01 · Context</small><strong>Chat + world state</strong
            ><span>memory · entities · integrations</span>
          </div>
          <div class="flow-connector"><i></i><span>classified</span></div>
          <div class="flow-node flow-primary">
            <small>02 · Governance</small><strong>Fail-closed policy gate</strong
            ><span>identity · permissions · data class</span>
          </div>
          <div class="flow-connector"><i></i><span>approved</span></div>
          <div class="flow-split">
            <div class="flow-node">
              <small>03A · Inline</small><strong>Immediate answer</strong>
            </div>
            <div class="flow-node">
              <small>03B · Durable</small><strong>Run to completion</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section page-width">
      <div class="section-heading section-heading-split">
        <div>
          <span class="section-index">03</span>
          <h2>Extend it around your world.</h2>
        </div>
        <p>
          The marketplace brings reusable capabilities into Personal Agent without weakening its
          permission and governance model.
        </p>
      </div>
      <div class="market-intro-grid">
        <router-link
          v-for="kind in marketplaceKinds"
          :key="kind.title"
          to="/marketplace"
          class="market-kind"
        >
          <span class="kind-number">{{ kind.number }}</span
          ><q-icon :name="kind.icon" />
          <h3>{{ kind.title }}</h3>
          <p>{{ kind.copy }}</p>
          <span class="kind-link"
            >Browse {{ kind.title.toLowerCase() }} <q-icon name="arrow_forward"
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
        <span class="section-index">Start here</span>
        <h2>Your world, handled.</h2>
      </div>
      <q-btn
        unelevated
        no-caps
        color="primary"
        label="Read the documentation"
        to="/docs/getting-started/"
        icon-right="arrow_forward"
      />
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';
import SiteIcon from '@/components/SiteIcon.vue';
import markUrl from '../../docs/assets/mark.svg?url';
import markDarkUrl from '../../docs/assets/mark-dark.svg?url';

useMeta({ title: 'Personal Agent — Your world, handled.' });

const principles = [
  { icon: 'lock', label: 'Private by design' },
  { icon: 'code', label: 'Open source' },
  { icon: 'clock', label: 'Durable execution' },
  { icon: 'policy', label: 'Fail-closed governance' },
] as const;

const primaryFeatures = [
  {
    icon: 'hub',
    title: 'World-state memory',
    copy: 'A bitemporal, causal graph connects live entities and long-term memory with provenance.',
    to: '/docs/features/memory/',
  },
  {
    icon: 'route',
    title: 'Durable work',
    copy: 'Agents and workflows keep running, survive interruption, and return results to the conversation.',
    to: '/docs/features/workflows/',
  },
  {
    icon: 'forum',
    title: 'Chat & agents',
    copy: 'Models, modes, security, sub-agents, voice, rewind and run revert in each conversation.',
    to: '/docs/features/chat/',
  },
  {
    icon: 'extension',
    title: 'Deep integrations',
    copy: 'Tools, agents, entities, surfaces, cards and message providers share one capability model.',
    to: '/docs/features/integrations/',
  },
  {
    icon: 'devices',
    title: 'Connected devices',
    copy: 'Computer and browser services provide scoped host capabilities without granting chat access.',
    to: '/docs/features/devices/',
  },
  {
    icon: 'shield',
    title: 'Security & governance',
    copy: 'Data classification, scoped credentials, budgets and explicit policy at every model boundary.',
    to: '/docs/features/security/',
  },
] as const;

const marketplaceKinds = [
  {
    number: '01',
    icon: 'smart_toy',
    title: 'Agents',
    copy: 'Purpose-built agents with defined capabilities and governed delegation.',
  },
  {
    number: '02',
    icon: 'construction',
    title: 'Skills',
    copy: 'Progressively disclosed expertise that agents load only when it is relevant.',
  },
  {
    number: '03',
    icon: 'extension',
    title: 'Integrations',
    copy: 'Connections to services and data that contribute tools and capabilities.',
  },
] as const;
</script>
