<script setup lang="ts">
import { provide, computed } from 'vue'
import { useRoute } from 'vue-router'
import { THEME_KEY } from 'vue-echarts'
import { useTheme } from '@/composables/useTheme'
import AppLayout from '@/components/layout/AppLayout.vue'

const { antdTheme, echartsTheme } = useTheme()
const route = useRoute()

// Provide ECharts theme to all child components
provide(THEME_KEY, echartsTheme)

// Check if current route needs layout
const needsLayout = computed(() => route.name !== 'login')
</script>

<template>
  <a-config-provider :theme="antdTheme">
    <AppLayout v-if="needsLayout" />
    <router-view v-else />
  </a-config-provider>
</template>

<style>
@import './assets/styles/main.css';
</style>
