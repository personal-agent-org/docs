<template>
  <q-page class="not-found flex flex-center">
    <div class="text-center">
      <div class="error-code">404</div>
      <h1>{{ t('notFound.title') }}</h1>
      <p>{{ t('notFound.copy') }}</p>
      <q-btn
        unelevated
        no-caps
        color="primary"
        text-color="dark"
        :label="t('notFound.back')"
        to="/"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
useMeta(() => ({
  title: t('notFound.meta'),
  meta: {
    robots: { name: 'robots', content: 'noindex, nofollow' },
  },
}));
</script>
