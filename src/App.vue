<script setup lang="ts">
import { provide, computed } from 'vue'
import { useRoute } from 'vue-router'
import { THEME_KEY } from 'vue-echarts'
import AppLayout from '@/components/layout/AppLayout.vue'

const route = useRoute()

// Provide ECharts theme to all child components
provide(THEME_KEY, 'light')

// Check if current route needs layout
const needsLayout = computed(() => route.name !== 'login')
</script>

<template>
  <a-config-provider>
    <AppLayout v-if="needsLayout" />
    <router-view v-else />
  </a-config-provider>
</template>

<style>
@import './assets/styles/main.css';
</style>
