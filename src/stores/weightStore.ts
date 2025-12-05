import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  WeightConfig,
  AchievementGenerationRequest,
  AchievementNetwork,
} from '@/types/weight'
import { weightService } from '@/services/weightService'
import { loadFromStorage, saveToStorage } from '@/utils/storage'

const STORAGE_KEY_WEIGHTS = 'dinq_weight_configs'
const STORAGE_KEY_CURRENT = 'dinq_current_weight'

export const useWeightStore = defineStore('weight', () => {
  // State
  const savedWeights = ref<WeightConfig[]>([])
  const currentWeight = ref<WeightConfig | null>(null)
  const networkData = ref<AchievementNetwork | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasData = computed(() => networkData.value !== null)
  const hasError = computed(() => error.value !== null)

  // Default weight configuration
  const defaultWeights: WeightConfig = {
    name: '默认权重',
    description: '系统默认权重配置',

    relationship_multipliers: {
      PHD_ADVISOR: 1.5,
      LABMATE: 1.3,
      PAPER_COAUTHOR: 1.2,
      OPEN_SOURCE_COLLABORATOR: 1.0,
      COLLEAGUE: 1.1,
      FORMER_COLLEAGUE: 0.9,
      ALUMNI: 0.8,
      SKILL_DOMAIN_EXPERT: 0.7,
    },
    impact_normalization: {
      github_divisor: 10000,
      openreview_divisor: 100,
    },
    frequency_impact_balance: {
      frequency: 0.5,
      impact: 0.5,
    },
    time_decay: {
      decay_rate: 0.2,
      recent_threshold: 3,
    },
    source_confidence: {
      github: 0.90,
      openreview: 0.95,
    },
    name_matching: {
      fuzzy_threshold: 0.85,
    },
  }

  // Actions
  async function generateNetwork(request: AchievementGenerationRequest) {
    loading.value = true
    error.value = null
    try {
      // 只发送 relationship_multipliers，不发送其他无用字段
      const weightsToSend = request.weights || currentWeight.value
      const cleanedWeights = weightsToSend ? {
        relationship_multipliers: weightsToSend.relationship_multipliers
      } : undefined

      const finalRequest: AchievementGenerationRequest = {
        ...request,
        weights: cleanedWeights,
        mode: request.mode || 'sync',
      }

      // DEBUG: 打印前端发送的完整请求
      console.log('=== 前端发送请求 ===')
      console.log('完整请求:', JSON.stringify(finalRequest, null, 2))
      if (finalRequest.weights?.relationship_multipliers) {
        console.log('关系类型权重:', finalRequest.weights.relationship_multipliers)
      }

      const response = await weightService.generateAchievementNetwork(finalRequest)

      // Backend returns { code, data, message }, extract data field
      let achievementArray: any[]

      if (Array.isArray(response)) {
        // Direct array
        achievementArray = response
      } else if (response?.data && Array.isArray(response.data)) {
        // Wrapped in { data: [...] }
        achievementArray = response.data
      } else if (response?.achievement_network && Array.isArray(response.achievement_network)) {
        // Already in correct format
        networkData.value = response
        return response
      } else {
        console.error('Unexpected response format:', response)
        throw new Error('Invalid response format from server')
      }

      // Wrap array in achievement_network field
      const data: AchievementNetwork = {
        achievement_network: achievementArray
      }

      networkData.value = data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || e.message || '生成网络失败'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  function saveWeight(weight: WeightConfig) {
    const existing = savedWeights.value.findIndex((w) => w.name === weight.name)
    if (existing >= 0) {
      savedWeights.value[existing] = weight
    } else {
      savedWeights.value.push(weight)
    }
    saveToStorage(STORAGE_KEY_WEIGHTS, savedWeights.value)
  }

  function deleteWeight(name: string) {
    savedWeights.value = savedWeights.value.filter((w) => w.name !== name)
    saveToStorage(STORAGE_KEY_WEIGHTS, savedWeights.value)
    if (currentWeight.value?.name === name) {
      currentWeight.value = null
      saveToStorage(STORAGE_KEY_CURRENT, null)
    }
  }

  function setCurrentWeight(weight: WeightConfig | null) {
    currentWeight.value = weight
    saveToStorage(STORAGE_KEY_CURRENT, weight)
  }

  function loadWeights() {
    savedWeights.value = loadFromStorage(STORAGE_KEY_WEIGHTS, [])
    currentWeight.value = loadFromStorage(STORAGE_KEY_CURRENT, null)
  }

  function resetToDefault() {
    currentWeight.value = { ...defaultWeights }
    saveToStorage(STORAGE_KEY_CURRENT, currentWeight.value)
  }

  function clearError() {
    error.value = null
  }

  // Initialize from storage
  loadWeights()

  return {
    // State
    savedWeights,
    currentWeight,
    networkData,
    loading,
    error,
    defaultWeights,
    // Computed
    hasData,
    hasError,
    // Actions
    generateNetwork,
    saveWeight,
    deleteWeight,
    setCurrentWeight,
    loadWeights,
    resetToDefault,
    clearError,
  }
})
