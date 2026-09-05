<template>
  <StorefrontSurface v-if="isPublic">
    <slot />
  </StorefrontSurface>
  <slot v-else />
  <Toaster rich-colors position="top-right" :offset="16" />
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import "./tailwind.css";
import { computed } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import StorefrontSurface from "@/components/storefront/StorefrontSurface.vue";
const pageContext = usePageContext();
const isPublic = computed(() => !String(pageContext.pageId).includes("/@adminPath") && pageContext.urlPathname !== "/setup");
</script>
