<template>
  <main class="auth-callback">
    <q-spinner color="primary" size="42px" />
    <p>{{ t('auth.completing') }}</p>
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { completeCustomerLogin } from '@/services/customerAuth';

const { t } = useI18n();
const router = useRouter();

onMounted(async () => {
  try {
    const returnTo = await completeCustomerLogin();
    if (returnTo !== '/') {
      window.location.replace(returnTo);
    } else {
      await router.replace('/');
    }
  } catch {
    await router.replace({ path: '/', query: { login: 'failed' } });
  }
});
</script>
