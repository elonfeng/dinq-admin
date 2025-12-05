import { storeToRefs } from 'pinia'
import { useWeightStore } from '@/stores/weightStore'
import type { WeightConfig, AchievementGenerationRequest, UserData, SocialUrls } from '@/types/weight'

export function useWeight() {
  const weightStore = useWeightStore()

  const {
    savedWeights,
    currentWeight,
    networkData,
    loading,
    error,
    hasData,
    hasError,
  } = storeToRefs(weightStore)

  const {
    defaultWeights,
    generateNetwork,
    saveWeight,
    deleteWeight,
    setCurrentWeight,
    resetToDefault,
    clearError,
  } = weightStore

  async function generateWithUserData(
    userData: UserData,
    socialUrls?: SocialUrls,
    weights?: WeightConfig
  ) {
    const request: AchievementGenerationRequest = {
      user_data: userData,
      social_urls: socialUrls,
      weights: weights || currentWeight.value || undefined,
      mode: 'sync',
    }
    return await generateNetwork(request)
  }

  function createNewWeight(name: string, description?: string): WeightConfig {
    return {
      ...defaultWeights,
      name,
      description: description || '',
    }
  }

  function duplicateWeight(source: WeightConfig, newName: string): WeightConfig {
    return {
      ...source,
      name: newName,
      description: `${source.description || ''} (副本)`,
    }
  }

  return {
    // State
    savedWeights,
    currentWeight,
    networkData,
    loading,
    error,
    defaultWeights,
    hasData,
    hasError,
    // Actions
    generateWithUserData,
    saveWeight,
    deleteWeight,
    setCurrentWeight,
    resetToDefault,
    clearError,
    createNewWeight,
    duplicateWeight,
  }
}
