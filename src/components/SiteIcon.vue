<template>
  <svg
    class="site-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'lock'">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </template>
    <template v-else-if="name === 'code'">
      <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </template>
    <template v-else-if="name === 'policy'">
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </template>
    <template v-else-if="name === 'menu'"><path d="M4 7h16M4 12h16M4 17h16" /></template>
    <template v-else-if="name === 'home'"><path d="m4 11 8-7 8 7v9h-6v-6h-4v6H4v-9Z" /></template>
    <template v-else-if="name === 'inbox'"><path d="M4 4h16v14H4zM4 13h4l2 3h4l2-3h4" /></template>
    <template v-else-if="name === 'calendar'">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 9h16" />
    </template>
    <template v-else-if="name === 'folder'"><path d="M3 6h7l2 2h9v11H3z" /></template>
    <template v-else-if="name === 'chat'"><path d="M4 5h16v12H9l-5 4V5Z" /></template>
    <template v-else-if="name === 'plus'"><path d="M12 5v14M5 12h14" /></template>
    <template v-else-if="name === 'send'"><path d="M12 19V5M6 11l6-6 6 6" /></template>
    <template v-else><circle cx="12" cy="12" r="8" /></template>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: string }>();
</script>
