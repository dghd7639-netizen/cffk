<template>
  <div class="admin-winter" :style="{ '--admin-blur': `${blurLevel * 42 / 100}px` }">
    <div v-if="isLoginPage" class="admin-login-tools"><Button variant="outline" size="sm" :aria-label="`后台玻璃虚化 ${blurLevel}%，点击切换`" @click="cycleAdminBlur">虚化 {{ blurLevel }}%</Button></div>
    <slot v-if="isLoginPage" />
    <SidebarProvider v-else class="min-h-svh bg-muted/40">
      <AdminSidebar />
      <SidebarInset>
        <header class="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:rounded-t-xl">
          <SidebarTrigger class="-ml-1 cursor-pointer" />
          <Separator orientation="vertical" class="h-4" />
          <nav class="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm" aria-label="当前位置">
            <template v-for="(title, index) in routeMeta.titles" :key="`${index}-${title}`">
              <span v-if="index > 0" class="text-muted-foreground">/</span>
              <span :class="index === routeMeta.titles.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'">{{ title }}</span>
            </template>
          </nav>
          <Button variant="outline" size="sm" class="shrink-0" :aria-label="`后台玻璃虚化 ${blurLevel}%，点击切换`" title="仅改变后台玻璃虚化，不影响商城" @click="cycleAdminBlur">{{ blurLevel }}%</Button>
        </header>
        <main class="@container/main flex flex-1 flex-col p-4 lg:p-6">
          <slot />
        </main>
      </SidebarInset>
    </SidebarProvider>
  </div>
</template>

<script lang="ts" setup>
import AdminSidebar from "@/components/AdminSidebar.vue";
import { Button } from "@/components/ui/button";
import { blurLevels, normalizeBlurLevel } from "@/lib/storefront-preferences";
import "./admin-winter.css";
import { Separator } from "@/components/ui/separator";
import { getAdminBreadcrumb } from "@/lib/admin-navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { computed, onMounted, provide, ref } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import { SITE_TIMEZONE_KEY } from "@/lib/site-timezone";
import { onGetSiteSettings } from "@/server/site/admin.telefunc";
import { runTelefunc } from "@/lib/telefunc-client";

const pageContext = usePageContext();
const basePath = computed(() => `/${pageContext.routeParams.adminPath}`);
const isLoginPage = computed(() => pageContext.urlPathname.replace(/\/$/, "") === basePath.value);
const routeMeta = computed(() => getAdminBreadcrumb(pageContext.urlPathname, basePath.value));
const timezone = ref("Asia/Shanghai");
const blurLevel = ref(5);
function cycleAdminBlur() {
  blurLevel.value = blurLevels[(blurLevels.findIndex(level => level === blurLevel.value) + 1) % blurLevels.length];
  try { localStorage.setItem("admin-blur", String(blurLevel.value)); } catch { /* Retain this visit's selection if storage is unavailable. */ }
}
provide(SITE_TIMEZONE_KEY, timezone);
onMounted(() => {
  try { blurLevel.value = normalizeBlurLevel(localStorage.getItem("admin-blur")); } catch { blurLevel.value = 5; }
  if (isLoginPage.value) return;
  void runTelefunc(() => onGetSiteSettings(), { notifyError: false }).then((settings) => { timezone.value = settings.timezone; }).catch(() => undefined);
});

</script>
