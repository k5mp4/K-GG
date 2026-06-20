<!-- K_GG/docs/.vitepress/theme/components/CldImage.vue -->
<template>
  <img
    :src="cloudinaryUrl"
    :alt="alt"
    v-bind="$attrs"
    loading="lazy"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  publicId: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  // 必要に応じて幅(w)や高さ(h)も指定できるように拡張可能
  width: [String, Number],
  height: [String, Number]
})

const cloudName = 'dtml8mtnv' 

const cloudinaryUrl = computed(() => {
  // f_auto: ブラウザに応じて最適な形式(WebP/AVIFなど)に自動変換
  // q_auto: 画質を落とさず自動圧縮
  const transforms = `f_auto,q_auto${props.width ? `,w_${props.width}` : ''}${props.height ? `,h_${props.height}` : ''}`
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${props.publicId}`
})
</script>
