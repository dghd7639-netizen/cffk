<template>
  <div class="storefront-winter" :class="{ 'storefront-home': isHome }" :style="{ '--site-blur': `${isHome ? 0 : blurLevel * 42 / 100}px` }">
    <slot />
    <p v-if="!isHome" class="px-5 py-3 text-center text-xs text-muted-foreground">背景：<a href="https://commons.wikimedia.org/wiki/File:Marmolada_Sunset.jpg" target="_blank" rel="noopener noreferrer" class="underline">Marmolada Sunset · Dmitry A. Mottl</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer" class="underline">CC BY-SA 3.0</a> · WebP 转换与显示裁切</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";
const pageContext = usePageContext();
const isHome = computed(() => pageContext.urlPathname === "/");
const { blurLevel } = useStorefrontPreferences();
</script>
