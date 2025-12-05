<script setup lang="ts">
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import { useWeight } from '@/composables/useWeight'
import WeightEditor from '@/components/weight/WeightEditor.vue'
import TestForm from '@/components/weight/TestForm.vue'
import NetworkGraph from '@/components/weight/NetworkGraph.vue'
import type { WeightConfig, UserData, SocialUrls } from '@/types/weight'

const {
  currentWeight,
  networkData,
  loading,
  hasError,
  error,
  defaultWeights,
  generateWithUserData,
  setCurrentWeight,
  resetToDefault,
  clearError,
} = useWeight()

// Computed
const editingWeight = computed(() => {
  if (!currentWeight.value) {
    return { ...defaultWeights }
  }
  return currentWeight.value
})

function handleResetToDefault() {
  resetToDefault()
  message.success('已重置为默认权重')
}

// Weight editor
function handleWeightUpdate(updated: WeightConfig) {
  setCurrentWeight(updated)
}

// Test and generate
async function handleGenerate(userData: UserData, socialUrls?: SocialUrls) {
  try {
    clearError()
    await generateWithUserData(userData, socialUrls, currentWeight.value || undefined)
    message.success('生成成功')
  } catch (e: any) {
    message.error(e || '生成失败')
  }
}
</script>

<template>
  <div class="weight-config-view">
    <!-- Page header -->
    <div class="page-header">
      <div class="header-content">
        <a-typography-title :level="2">关键人物TOP6生成</a-typography-title>
        <a-typography-paragraph type="secondary">
          调整权重参数，生成并可视化
        </a-typography-paragraph>
      </div>
    </div>

    <!-- Error alert -->
    <a-alert
      v-if="hasError"
      :message="error"
      type="error"
      closable
      show-icon
      style="margin-bottom: 24px"
      @close="clearError"
    />

    <a-row :gutter="24">
      <!-- Full width content -->
      <a-col :xs="24">
        <a-space direction="vertical" :size="24" style="width: 100%">
          <!-- Weight editor -->
          <WeightEditor
            :model-value="editingWeight"
            :loading="loading"
            @update:model-value="handleWeightUpdate"
            @reset="handleResetToDefault"
          />

          <!-- Test form and network graph -->
          <a-row :gutter="24">
            <a-col :xs="24" :xl="8">
              <TestForm
                :loading="loading"
                @generate="handleGenerate"
              />
            </a-col>
            <a-col :xs="24" :xl="16">
              <NetworkGraph :data="networkData" :loading="loading" :height="600" />
            </a-col>
          </a-row>
        </a-space>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.weight-config-view {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #262626;
}

.page-header :deep(.ant-typography) {
  margin-bottom: 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .weight-config-view {
    padding: 16px;
  }
}
</style>
