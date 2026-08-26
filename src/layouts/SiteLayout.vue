<template>
  <q-layout view="hHh lpR fFf" class="site-shell">
    <q-header class="site-header">
      <q-toolbar class="site-toolbar page-width">
        <router-link class="brand" :to="localePath('/')" aria-label="Personal Agent home">
          <img class="brand-logo" :src="logoUrl" alt="" width="34" height="34" />
          <span>Personal Agent</span>
        </router-link>

        <q-space />

        <nav class="desktop-nav" :aria-label="t('nav.main')">
          <q-btn flat no-caps :label="t('nav.about')" :to="`${localePath('/')}#about`" />
          <q-btn flat no-caps :label="t('nav.marketplace')" :to="localePath('/marketplace')" />
          <q-btn flat no-caps :label="t('nav.docs')" to="/docs/getting-started/" />
          <q-btn-dropdown flat no-caps :label="t('nav.cloud')" content-class="site-dropdown">
            <q-list dark>
              <q-item clickable v-close-popup :to="localePath('/cloud-connect')">
                <q-item-section avatar><q-icon name="cable" /></q-item-section>
                <q-item-section>{{ t('nav.cloudConnect') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup :to="localePath('/cloud')">
                <q-item-section avatar><q-icon name="cloud" /></q-item-section>
                <q-item-section>{{ t('nav.hosted') }}</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            flat
            no-caps
            :label="t('nav.github')"
            href="https://github.com/personal-agent-org"
            target="_blank"
          >
            <q-icon name="open_in_new" size="16px" class="q-ml-xs" />
          </q-btn>
          <q-btn-dropdown
            flat
            dense
            no-caps
            class="locale-menu"
            content-class="site-dropdown locale-dropdown"
            :label="locale.toUpperCase()"
            :aria-label="t('nav.language')"
          >
            <q-list dark dense>
              <q-item clickable v-close-popup @click="changeLocale('en')">
                <q-item-section>English</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="changeLocale('de')">
                <q-item-section>Deutsch</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn
            unelevated
            no-caps
            color="primary"
            text-color="dark"
            :label="t('nav.organizations')"
            :to="localePath('/organizations')"
            class="organizations-nav-button"
          />
        </nav>

        <q-btn
          class="mobile-menu"
          flat
          round
          icon="menu"
          :aria-label="t('nav.open')"
          @click="drawerOpen = true"
        />
      </q-toolbar>
      <a
        class="sponsor-bar"
        href="https://token-router.eu/"
        target="_blank"
        rel="sponsored noopener"
      >
        <span>{{ t('sponsor.label') }}</span>
        <strong>token-router.eu</strong>
        <i aria-hidden="true">—</i>
        <span>{{ t('sponsor.claim') }}</span>
        <q-icon name="north_east" aria-hidden="true" />
      </a>
    </q-header>

    <q-drawer v-model="drawerOpen" side="right" overlay behavior="mobile" class="mobile-drawer">
      <q-list padding>
        <q-item clickable v-close-popup :to="`${localePath('/')}#about`"
          ><q-item-section>{{ t('nav.about') }}</q-item-section></q-item
        >
        <q-item clickable v-close-popup :to="localePath('/marketplace')"
          ><q-item-section>{{ t('nav.marketplace') }}</q-item-section></q-item
        >
        <q-item clickable v-close-popup to="/docs/getting-started/"
          ><q-item-section>{{ t('nav.documentation') }}</q-item-section></q-item
        >
        <q-item clickable v-close-popup :to="localePath('/cloud-connect')">
          <q-item-section avatar><q-icon name="cable" /></q-item-section>
          <q-item-section>{{ t('nav.cloudConnect') }}</q-item-section>
        </q-item>
        <q-item clickable v-close-popup :to="localePath('/cloud')">
          <q-item-section avatar><q-icon name="cloud" /></q-item-section>
          <q-item-section>{{ t('nav.hosted') }}</q-item-section>
        </q-item>
        <q-item
          clickable
          v-close-popup
          :to="localePath('/organizations')"
          class="mobile-business-link"
          ><q-item-section>{{ t('nav.organizations') }}</q-item-section></q-item
        >
        <q-item clickable href="https://github.com/personal-agent-org" target="_blank">
          <q-item-section>{{ t('nav.github') }}</q-item-section>
        </q-item>
        <q-separator dark spaced />
        <q-item-label header>{{ t('nav.language') }}</q-item-label>
        <q-item clickable v-close-popup @click="changeLocale('en')">
          <q-item-section>English</q-item-section>
          <q-item-section v-if="locale === 'en'" side><q-icon name="check" /></q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="changeLocale('de')">
          <q-item-section>Deutsch</q-item-section>
          <q-item-section v-if="locale === 'de'" side><q-icon name="check" /></q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <footer class="site-footer">
      <div class="page-width footer-grid">
        <div>
          <div class="brand footer-brand">
            <img class="brand-logo" :src="logoUrl" alt="" width="34" height="34" />
            <span>Personal Agent</span>
          </div>
          <p>{{ t('footer.slogan') }}</p>
        </div>
        <div>
          <strong>{{ t('footer.explore') }}</strong>
          <router-link :to="localePath('/organizations')">{{ t('nav.organizations') }}</router-link>
          <router-link :to="localePath('/cloud-connect')">{{ t('nav.cloudConnect') }}</router-link>
          <router-link :to="localePath('/cloud')">{{ t('nav.hosted') }}</router-link>
          <router-link :to="localePath('/marketplace')">{{ t('nav.marketplace') }}</router-link>
          <router-link to="/docs/getting-started/">{{ t('nav.documentation') }}</router-link>
        </div>
        <div>
          <strong>{{ t('footer.project') }}</strong>
          <a href="https://github.com/personal-agent-org">{{ t('nav.github') }}</a>
          <a href="https://github.com/personal-agent-org/docs/blob/main/LICENSE">{{
            t('footer.license')
          }}</a>
        </div>
      </div>
    </footer>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { detectPreferredLocale, setSiteLocale, type SiteLocale } from '@/i18n';
import { useLocalePath } from '@/composables/useLocalePath';
import logoUrl from '../../docs/assets/logo-header.svg?url';

const drawerOpen = ref(false);
const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();

function changeLocale(nextLocale: SiteLocale) {
  setSiteLocale(nextLocale);
  drawerOpen.value = false;
  void router.push(localePath(route.fullPath));
}

onMounted(() => {
  const preferred = detectPreferredLocale();
  const onLocalizedPage =
    route.path === '/' ||
    route.path === '/de' ||
    ['/organizations', '/cloud-connect', '/cloud', '/marketplace'].some((root) =>
      route.path.replace(/^\/de(?=\/|$)/, '').startsWith(root),
    );
  if (onLocalizedPage && preferred !== locale.value) changeLocale(preferred);
});
</script>
