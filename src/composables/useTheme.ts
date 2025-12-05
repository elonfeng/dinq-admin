/**
 * Theme composable
 * Manages dark/light theme switching with useDark from @vueuse/core
 */

import { computed } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { theme as antTheme } from 'ant-design-vue'
import { saveCurrentTheme } from '@/utils/storage'

export function useTheme() {
  // Use VueUse's useDark for automatic theme management
  const isDark = useDark({
    storageKey: 'dinq_admin_current_theme',
    valueDark: 'dark',
    valueLight: 'light',
  })

  const toggleDark = useToggle(isDark)

  // Ant Design Vue theme configuration
  const antdTheme = computed(() => ({
    algorithm: isDark.value ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
  }))

  // ECharts theme name
  const echartsTheme = computed(() => (isDark.value ? 'dark' : 'light'))

  // Current theme mode
  const themeMode = computed(() => (isDark.value ? 'dark' : 'light'))

  // Switch theme
  function setTheme(mode: 'light' | 'dark') {
    isDark.value = mode === 'dark'
    saveCurrentTheme(mode)
  }

  return {
    isDark,
    toggleDark,
    antdTheme,
    echartsTheme,
    themeMode,
    setTheme,
  }
}
