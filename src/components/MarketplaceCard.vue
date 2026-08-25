<template>
  <q-card flat class="market-card column no-wrap" :class="`kind-${item.kind}`">
    <q-card-section class="row items-start no-wrap q-gutter-md">
      <div class="market-icon"><q-icon :name="item.icon" size="28px" /></div>
      <div class="col">
        <div class="row items-center q-gutter-sm">
          <span class="eyebrow">{{ item.kind }}</span>
          <q-icon v-if="item.verified" name="verified" size="16px" color="secondary">
            <q-tooltip>Verified publisher</q-tooltip>
          </q-icon>
        </div>
        <h3>{{ item.name }}</h3>
        <p>{{ item.summary }}</p>
      </div>
    </q-card-section>
    <q-space />
    <q-card-section class="card-meta">
      <div class="tag-row">
        <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
      <div class="row items-center justify-between q-mt-lg">
        <span class="publisher">by {{ item.publisher }}</span>
        <q-btn
          flat
          no-caps
          color="primary"
          label="View details"
          :to="`/marketplace/${item.slug}`"
          icon-right="arrow_forward"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { MarketplaceItem } from '@/types/marketplace';

defineProps<{ item: MarketplaceItem }>();
</script>
