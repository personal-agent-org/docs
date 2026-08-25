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
        placeholder="Filter documentation"
        aria-label="Filter documentation"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>
      <nav aria-label="Documentation">
        <div v-for="group in visibleGroups" :key="group.name" class="docs-group">
          <div class="docs-group-title">{{ group.name }}</div>
          <router-link v-for="page in group.pages" :key="page.slug" :to="`/docs/${page.slug}`">{{
            page.title
          }}</router-link>
        </div>
      </nav>
    </aside>

    <main class="docs-content">
      <div class="docs-kicker"><q-icon name="menu_book" /> Documentation</div>
      <article v-if="document" class="markdown-body" v-html="renderedMarkdown"></article>
      <div v-else class="empty-state">
        <h1>Page not found</h1>
        <p>This documentation page does not exist.</p>
        <q-btn
          flat
          no-caps
          color="primary"
          label="Documentation home"
          to="/docs/getting-started/"
        />
      </div>
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import MarkdownIt from 'markdown-it';
import { useMeta } from 'quasar';
import { useRoute } from 'vue-router';

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

const groupLabels: Record<string, string> = {
  'getting-started': 'Getting started',
  features: 'User guide',
  administration: 'Administration',
  architecture: 'Architecture',
  development: 'Development',
  design: 'Design notes',
  comparisons: 'Comparisons',
};

const groupedPages = computed<DocGroup[]>(() => {
  const grouped = new Map<string, DocPage[]>();
  for (const page of pages) {
    const segment = page.slug.split('/')[0] || 'overview';
    const label = groupLabels[segment] ?? 'More';
    grouped.set(label, [...(grouped.get(label) ?? []), page]);
  }
  const order = [
    'Getting started',
    'User guide',
    'Administration',
    'Architecture',
    'Development',
    'Design notes',
    'Comparisons',
    'More',
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
useMeta(() => ({ title: document.value?.title ?? 'Documentation' }));
</script>
