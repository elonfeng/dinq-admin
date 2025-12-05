<script setup lang="ts">
import { ref, watch } from 'vue'
import type { WeightConfig } from '@/types/weight'
import { ReloadOutlined } from '@ant-design/icons-vue'

interface Props {
  modelValue: WeightConfig
  loading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: WeightConfig): void
  (e: 'reset'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const localWeights = ref<WeightConfig>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (newValue) => {
    localWeights.value = { ...newValue }
  },
  { deep: true }
)

// Generic update function for any nested property
function updateWeight(group: string, key: string, value: number) {
  const updated = { ...localWeights.value } as any
  if (!updated[group]) {
    updated[group] = {}
  }
  updated[group][key] = value
  localWeights.value = updated
  emit('update:modelValue', localWeights.value)
}

function handleReset() {
  emit('reset')
}

// Relationship type weight configurations with icons
const relationshipParams = [
  {
    key: 'PHD_ADVISOR',
    label: '👨‍🏫 PhD 导师',
    min: 0,
    max: 3,
    step: 0.1,
    description: '导师关系的得分乘数，默认 1.5x'
  },
  {
    key: 'LABMATE',
    label: '🧑‍🔬 实验室成员',
    min: 0,
    max: 3,
    step: 0.1,
    description: '实验室伙伴，默认 1.3x'
  },
  {
    key: 'PAPER_COAUTHOR',
    label: '📝 论文合著者',
    min: 0,
    max: 3,
    step: 0.1,
    description: '论文合作关系，默认 1.2x'
  },
  {
    key: 'OPEN_SOURCE_COLLABORATOR',
    label: '💻 开源协作者',
    min: 0,
    max: 3,
    step: 0.1,
    description: 'GitHub 合作者，默认 1.0x（基准）'
  },
  {
    key: 'COLLEAGUE',
    label: '🤝 同事',
    min: 0,
    max: 3,
    step: 0.1,
    description: '同事关系，默认 1.1x'
  },
  {
    key: 'FORMER_COLLEAGUE',
    label: '👔 前同事',
    min: 0,
    max: 3,
    step: 0.1,
    description: '前同事关系，默认 0.9x'
  },
  {
    key: 'ALUMNI',
    label: '🎓 校友',
    min: 0,
    max: 3,
    step: 0.1,
    description: '校友关系，默认 0.8x'
  },
  {
    key: 'SKILL_DOMAIN_EXPERT',
    label: '🎯 技能领域专家',
    min: 0,
    max: 3,
    step: 0.1,
    description: '技能&方向专家，默认 0.7x'
  },
]
</script>

<template>
  <div class="weight-editor">
    <!-- Header with actions -->
    <div class="editor-header">
      <div class="header-info">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #262626;">关系类型权重配置</h3>
        <span style="font-size: 13px; color: #8c8c8c;">调整不同关系类型的得分乘数，直接影响最终排序</span>
      </div>
      <a-button @click="handleReset">
        <template #icon>
          <ReloadOutlined />
        </template>
        重置为默认
      </a-button>
    </div>

    <!-- Weight parameters - removed collapse, show directly -->
    <div class="weight-params">
      <div v-for="param in relationshipParams" :key="param.key" class="param-item">
        <div class="param-header">
          <span class="param-label">{{ param.label }}</span>
          <a-input-number
            :value="(localWeights.relationship_multipliers as any)?.[param.key]"
            :min="param.min"
            :max="param.max"
            :step="param.step"
            size="small"
            style="width: 90px"
            @update:value="(val: any) => updateWeight('relationship_multipliers', param.key, val)"
          />
        </div>
        <a-slider
          :value="(localWeights.relationship_multipliers as any)?.[param.key]"
          :min="param.min"
          :max="param.max"
          :step="param.step"
          :marks="{ 1.0: '1.0x' }"
          :tooltip="{ formatter: (val: any) => `${val.toFixed(1)}x` }"
          @update:value="(val: any) => updateWeight('relationship_multipliers', param.key, val)"
        />
        <p class="param-description">{{ param.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weight-editor {
  padding: 0;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  gap: 16px;
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.weight-params {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px 0;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.param-label {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
}

.param-description {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.5;
}

/* Slider styling */
:deep(.ant-slider) {
  margin: 8px 0 0 0;
}

:deep(.ant-slider-track) {
  background-color: #4096ff;
}

:deep(.ant-slider-handle) {
  border-color: #4096ff;
}

:deep(.ant-slider-handle:hover),
:deep(.ant-slider-handle:focus) {
  border-color: #1677ff;
}

/* Input number styling */
:deep(.ant-input-number) {
  border-radius: 4px;
}

@media (max-width: 768px) {
  .editor-header {
    flex-direction: column;
  }

  .header-info {
    width: 100%;
  }

  .header-info input {
    max-width: 100% !important;
  }
}
</style>
