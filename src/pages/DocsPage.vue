<template>
  <q-page class="docs-page page-width">
    <aside class="docs-sidebar">
      <q-input
        v-model="search"
        dense
        outlined
        rounded
        dark
        clearable
        :placeholder="t('docs.filter')"
        :aria-label="t('docs.filter')"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <nav :aria-label="t('docs.title')">
        <div v-for="group in visibleGroups" :key="group.name" class="docs-group">
          <div class="docs-group-title">{{ group.name }}</div>
          <router-link v-for="page in group.pages" :key="page.slug" :to="`/docs/${page.slug}`">{{
            page.title
          }}</router-link>
        </div>
      </nav>
    </aside>

    <main class="docs-content">
      <div class="docs-kicker"><q-icon name="menu_book" /> {{ t('docs.title') }}</div>
      <article v-if="document" class="markdown-body" v-html="renderedMarkdown"></article>
      <div v-else class="empty-state">
        <h1>{{ t('docs.notFound') }}</h1>
        <p>{{ t('docs.notFoundCopy') }}</p>
        <q-btn flat no-caps color="primary" :label="t('docs.home')" to="/docs/getting-started/" />
      </div>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import MarkdownIt from 'markdown-it';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSeo } from '@/composables/useSeo';

interface DocPage {
  slug: string;
  title: string;
  source: string;
}

interface DocGroup {
  name: string;
  pages: DocPage[];
}

const sources = import.meta.glob('../../docs/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function stripFrontmatter(source: string): string {
  return source
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/:[a-z0-9-]+:(?:\{[^}]*\})?/gi, '')
    .replace(/\s*\{\s*\.[a-z0-9 _.-]+\s*\}\s*$/gim, '');
}

function slugFromPath(path: string): string {
  return path
    .replace(/^\.\.\/\.\.\/docs\//, '')
    .replace(/\.md$/, '')
    .replace(/(^|\/)index$/, '$1');
}

function titleFromSource(source: string, slug: string): string {
  return (
    stripFrontmatter(source)
      .match(/^#\s+(.+)$/m)?.[1]
      ?.replace(/\s+\{.*\}$/, '') ??
    slug.split('/').filter(Boolean).at(-1) ??
    'Documentation'
  );
}

const pages = Object.entries(sources)
  .map(([path, source]) => {
    const slug = slugFromPath(path);
    return { slug, source, title: titleFromSource(source, slug) };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

const groupKeys: Record<string, string> = {
  'getting-started': 'docs.groups.gettingStarted',
  features: 'docs.groups.userGuide',
  administration: 'docs.groups.administration',
  architecture: 'docs.groups.architecture',
  development: 'docs.groups.development',
  design: 'docs.groups.design',
  comparisons: 'docs.groups.comparisons',
};

const { t } = useI18n();

const groupedPages = computed<DocGroup[]>(() => {
  const grouped = new Map<string, DocPage[]>();
  for (const page of pages) {
    const segment = page.slug.split('/')[0] || 'overview';
    const label = t(groupKeys[segment] ?? 'docs.groups.more');
    grouped.set(label, [...(grouped.get(label) ?? []), page]);
  }
  const order = [
    t('docs.groups.gettingStarted'),
    t('docs.groups.userGuide'),
    t('docs.groups.administration'),
    t('docs.groups.architecture'),
    t('docs.groups.development'),
    t('docs.groups.design'),
    t('docs.groups.comparisons'),
    t('docs.groups.more'),
  ];
  return [...grouped.entries()]
    .map(([name, groupPages]) => ({ name, pages: groupPages }))
    .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
});

const search = ref('');
const visibleGroups = computed(() => {
  const needle = search.value.trim().toLocaleLowerCase();
  if (!needle) return groupedPages.value;
  return groupedPages.value
    .map((group) => ({
      ...group,
      pages: group.pages.filter((page) => page.title.toLocaleLowerCase().includes(needle)),
    }))
    .filter((group) => group.pages.length > 0);
});

const route = useRoute();
const requestedSlug = computed(() => {
  const param = route.params.pathMatch;
  const raw = Array.isArray(param) ? param.join('/') : String(param ?? '');
  return raw.replace(/^\/+|\/+$/g, '') || 'getting-started/';
});
const document = computed(() =>
  pages.find((page) => page.slug.replace(/\/$/, '') === requestedSlug.value.replace(/\/$/, '')),
);

function resolveDocLink(href: string, currentSlug: string): string {
  if (/^(?:[a-z]+:|#|\/)/i.test(href)) return href;
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const bareHref = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const base = currentSlug.endsWith('/')
    ? currentSlug
    : currentSlug.slice(0, currentSlug.lastIndexOf('/') + 1);
  const normalized = new URL(bareHref, `https://docs.local/${base}`).pathname
    .replace(/^\//, '')
    .replace(/\.md$/, '')
    .replace(/(^|\/)index$/, '$1');
  return `/docs/${normalized}${hash}`;
}

const markdown = new MarkdownIt({ html: true, linkify: true, typographer: true });
const defaultLinkOpen = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const hrefIndex = tokens[index]?.attrIndex('href') ?? -1;
  const href = hrefIndex >= 0 ? tokens[index]?.attrs?.[hrefIndex]?.[1] : undefined;
  if (href && !/^(?:https?:|mailto:|#)/i.test(href)) {
    tokens[index]?.attrSet('href', resolveDocLink(href, String(env.slug)));
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, index, options, env, self)
    : self.renderToken(tokens, index, options);
};

const renderedMarkdown = computed(() =>
  document.value
    ? markdown.render(stripFrontmatter(document.value.source), { slug: document.value.slug })
    : '',
);

let mermaidInitialized = false;

async function renderMermaid(): Promise<void> {
  if (typeof globalThis.document === 'undefined') return;

  await nextTick();
  const nodes = globalThis.document.querySelectorAll<HTMLElement>(
    '.docs-content pre code.language-mermaid',
  );
  if (nodes.length === 0) return;

  const { default: mermaid } = await import('mermaid');
  if (!mermaidInitialized) {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
    mermaidInitialized = true;
  }

  for (const code of nodes) {
    const container = globalThis.document.createElement('div');
    container.className = 'mermaid';
    container.textContent = code.textContent;
    code.parentElement?.replaceWith(container);
  }
  await mermaid.run({
    nodes: globalThis.document.querySelectorAll<HTMLElement>('.docs-content .mermaid'),
    suppressErrors: true,
  });
}

watch(renderedMarkdown, renderMermaid, { flush: 'post', immediate: true });

function documentDescription(source: string): string {
  const description = stripFrontmatter(source)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+.*$/gm, ' ')
    .replace(/[|#>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return description.length > 160
    ? `${description.slice(0, 157).replace(/\s+\S*$/, '')}…`
    : description;
}

useSeo({
  title: () => document.value?.title ?? t('docs.title'),
  description: () =>
    document.value ? documentDescription(document.value.source) : t('docs.notFoundCopy'),
});
</script>
