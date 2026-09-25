<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../adr.data'
</script>

<template>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>判断</th>
        <th>状態</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="entry in data" :key="entry.url">
        <td>{{ entry.id }}</td>
        <td><a :href="withBase(entry.url)">{{ entry.title }}</a></td>
        <td>{{ entry.status }}</td>
      </tr>
    </tbody>
  </table>
</template>
