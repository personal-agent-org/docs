<template>
  <q-page class="not-found flex flex-center">
    <div class="text-center">
      <div class="error-code">404</div>
      <h1>That path is uncharted.</h1>
      <p>The page may have moved, or it never existed.</p>
      <q-btn unelevated no-caps color="primary" text-color="dark" label="Back home" to="/" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar';
useMeta({ title: 'Not found' });
</script>
