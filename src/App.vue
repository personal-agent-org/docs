<template>
  <router-view />
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';

useMeta({
  title: 'Personal Agent',
  titleTemplate: (title) =>
    !title || title === 'Personal Agent' ? 'Personal Agent' : `${title} · Personal Agent`,
  meta: {
    description: {
      name: 'description',
      content:
        'The open, self-hostable home for your AI agents, skills, integrations, and private data.',
    },
    ogType: { property: 'og:type', content: 'website' },
    ogSiteName: { property: 'og:site_name', content: 'Personal Agent' },
  },
});
</script>
