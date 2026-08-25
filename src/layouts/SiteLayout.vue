<template>
  <q-layout view="hHh lpR fFf" class="site-shell">
    <q-header class="site-header">
      <q-toolbar class="site-toolbar page-width">
        <router-link class="brand" to="/" aria-label="Personal Agent home">
          <span class="brand-mark" aria-hidden="true">pa</span>
          <span>Personal Agent</span>
        </router-link>

        <q-space />

        <nav class="desktop-nav" aria-label="Main navigation">
          <q-btn flat no-caps label="Product" href="/#product" />
          <q-btn flat no-caps label="Marketplace" to="/marketplace" />
          <q-btn flat no-caps label="Docs" to="/docs/getting-started/" />
          <q-btn
            flat
            no-caps
            label="GitHub"
            href="https://github.com/personal-agent-org"
            target="_blank"
          >
            <q-icon name="open_in_new" size="16px" class="q-ml-xs" />
          </q-btn>
        </nav>

        <q-btn
          class="mobile-menu"
          flat
          round
          icon="menu"
          aria-label="Open navigation"
          @click="drawerOpen = true"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" side="right" overlay behavior="mobile" class="mobile-drawer">
      <q-list padding>
        <q-item clickable v-close-popup href="/#product"
          ><q-item-section>Product</q-item-section></q-item
        >
        <q-item clickable v-close-popup to="/marketplace"
          ><q-item-section>Marketplace</q-item-section></q-item
        >
        <q-item clickable v-close-popup to="/docs/getting-started/"
          ><q-item-section>Documentation</q-item-section></q-item
        >
        <q-item clickable href="https://github.com/personal-agent-org" target="_blank">
          <q-item-section>GitHub</q-item-section>
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
            <span class="brand-mark">pa</span><span>Personal Agent</span>
          </div>
          <p>Your agents. Your tools. Your data.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <router-link to="/marketplace">Marketplace</router-link>
          <router-link to="/docs/getting-started/">Documentation</router-link>
        </div>
        <div>
          <strong>Project</strong>
          <a href="https://github.com/personal-agent-org">GitHub</a>
          <a href="https://github.com/personal-agent-org/docs/blob/main/LICENSE">MIT license</a>
        </div>
      </div>
    </footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const drawerOpen = ref(false);
</script>
