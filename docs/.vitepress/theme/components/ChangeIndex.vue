<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../changes.data'

const props = defineProps<{ bucket: 'active' | 'archive' }>()

const entries = computed(() => data.filter(entry => entry.bucket === props.bucket))
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>変更</th>
        <th>状態</th>
        <th>Current Spec</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="entries.length === 0">
        <td>なし</td>
        <td>{{ bucket === 'active' ? 'Active Changeはありません' : '完了済みChangeはありません' }}</td>
        <td>-</td>
        <td>-</td>
      </tr>
      <tr v-for="entry in entries" :key="entry.url">
        <td>{{ entry.id }}</td>
        <td><a :href="withBase(entry.url)">{{ entry.title }}</a></td>
        <td>{{ entry.status }}</td>
        <td>{{ entry.currentSpecs.join(', ') || '-' }}</td>
      </tr>
    </tbody>
  </table>
</template>
